import { existsSync, readFileSync, writeFileSync } from "fs";
import { basename } from "path";
import { CallExpression, ClassDeclaration, ExpressionWithTypeArguments, FunctionExpression, InterfaceDeclaration, ObjectLiteralExpression, Project, Type } from "ts-morph";
import { Glob, serve } from "bun";
// hash
import { createHash } from "crypto";

const project = new Project();

let hashes = {};
try {
    // read ./hashes.json
    hashes = JSON.parse(readFileSync("./hashes.json", "utf8"));
} catch(err) {}

project.addSourceFilesAtPaths(__dirname + "/src/methods/**/*.ts");

const serverMethodsPath = __dirname + "/../client/src/lib/serverMethods.ts";

const sourceFiles = project.getSourceFiles();
try {
    var callMethod = readFileSync("../client/src/lib/serverMethods.ts", "utf8");
} catch (e) {
    var callMethod = "";
}
const serverMethodsProject = new Project();
// read server methods file
if (!existsSync(serverMethodsPath)) {
    writeFileSync(serverMethodsPath, "export const serverMethods = {};", "utf8");
}
let serverMethodsFile = serverMethodsProject.addSourceFileAtPath(serverMethodsPath);
const serverMethodsDeclaration = serverMethodsFile.getVariableDeclaration("serverMethods");
// let serverMethodsKeys = serverMethodsFile.getVariableDeclaration("serverMethods");
// get all import statements
let imports = serverMethodsFile.getImportDeclarations();
let importData = {};
for (let importDeclaration of imports) {
    importData[importDeclaration.getModuleSpecifierValue()] = importDeclaration.getDefaultImport().getText();
}
const initializer = serverMethodsDeclaration.getInitializer() as ObjectLiteralExpression;
let serverMethods = {};
// get key/values in serverMethods initializer
let serverMethodsKeys: any[] = initializer.getProperties();
serverMethodsKeys.forEach(key => {
    serverMethods[key.getName()] = key.getInitializer().getText();
});


sourceFiles.forEach(sourceFile => {
    // check if changed
    var hash = createHash("sha256").update(sourceFile.getFullText()).digest("hex");
    if (hashes[sourceFile.getFilePath().replace(process.cwd(),"")] === hash) {
        return;
    }

    // command is bun copyData.ts
    // if there is a command line parameter after that of file name eg: bun copyData.ts loginUserGoogle.ts then this is debug and i'm testing
    // return if that file is specified, and "sourceFile" doesn't end with that file name
    if (process.argv[2]?.endsWith(".ts") && !sourceFile.getFilePath().endsWith(process.argv[2])) {
        return;
    }

    // get default exported function
    let declarations = sourceFile.getDefaultExportSymbol()?.getDeclarations() as any;
    if (declarations?.length) {
        let params = declarations[0].getExpression().getArguments()[0].getParameters().slice(1);

        let methodName = basename(sourceFile.getFilePath()).replace(/\.ts$/, '');
        let methodPath = sourceFile.getFilePath().split("src/methods/")[1];
        // get return type
        let returnType = declarations[0].getExpression().getArguments()[0].getReturnType() as Type;
        let returnTypeText = returnType.getText();
        let { typeStrFixed, imports } = ensureClassCopied(returnTypeText);

        // create/replace new source file at ../client/src/types
        const outputSourceFile = project.createSourceFile(`../client/src/serverTypes/${methodName}.ts`, {
            statements: writer => {
                writer.writeLine(
                    `import callMethod from "../lib/callMethod";
                     

export default function ${methodName}(${params.map(param => param.getText()).join(", ")}) {
    return callMethod("${methodName}", [...arguments]) as Promise<{ error?: string, data: ${typeStrFixed.replace(/Promise<(.+)>/, "$1")} }>;
};`
                );


            }
        }, { overwrite: true });
        for (let value of Object.values(imports)) {
            outputSourceFile.addImportDeclaration({
                moduleSpecifier: "./" + value + ".model",
                namedImports: [value]
            });
        }

        outputSourceFile.saveSync();
        let parts = methodPath.replace(/\.ts$/, '').split("/");
        serverMethods[methodName] = methodName;
        
    }
    hashes[sourceFile.getFilePath().replace(process.cwd(),"")] = createHash("sha256").update(sourceFile.getFullText()).digest("hex");
});

for (let key in serverMethods) {
    // get all the keys in serverMethods
    let path = `../serverTypes/${key}`;
    if (!importData[path]) {
        serverMethodsFile.addImportDeclaration({
            defaultImport: key,
            moduleSpecifier: path
        });
    }
    if (!serverMethodsKeys.find(item => item.getName() === key)) {
        (initializer as any).addPropertyAssignment({
            name: key,
            initializer: serverMethods[key]
        });
    }
}

function ensureClassCopied(typeStr: string) {
    let imports = {} as { [path: string]: string };
    let types = typeStr.matchAll(/import\("([^"]+)"\)\.(\w+)/g);
    for (let type of types) {
        let [_, path, typeName] = type;
        imports[path] = typeName;
        typeStr = typeStr.replace(_, typeName);
    }
    // export model definitions to (`../client/src/serverTypes/${ClassName}.model.ts`
    for (let [path, typeName] of Object.entries(imports)) {
        let sourceFile = project.addSourceFileAtPath(path + ".ts");
        let model = sourceFile.getExportedDeclarations()?.get(typeName)?.[0] as InterfaceDeclaration | ClassDeclaration;
        let extendsDeclaration = model?.getExtends() as ExpressionWithTypeArguments[] | ExpressionWithTypeArguments;
        if (!(model instanceof InterfaceDeclaration) && !(model instanceof ClassDeclaration)) {
            continue;
        }
        const outputSourceFile = project.createSourceFile(`../client/src/serverTypes/${typeName}.model.ts`, {}, { overwrite: true });
        let extendsStr;
        if (extendsDeclaration && !Array.isArray(extendsDeclaration)) {
            let extendsType = extendsDeclaration.getExpression().getType().getText()?.replace(/typeof /, '');
            let { imports, typeStrFixed } = ensureClassCopied(extendsType);
            outputSourceFile.addImportDeclaration({
                moduleSpecifier: "./" + typeStrFixed + ".model",
                namedImports: [typeStrFixed]
            });
            extendsStr = typeStrFixed
        }
        if (model instanceof InterfaceDeclaration) {
            outputSourceFile.addInterface({
                name: typeName,
                isExported: true,
                extends: extendsStr,
                properties: model.getProperties().map(property => {
                    let { imports, typeStrFixed } = ensureClassCopied(property.getType().getText());
                    for (let value of Object.values(imports)) {
                        outputSourceFile.addImportDeclaration({
                            moduleSpecifier: "./" + value + ".model",
                            namedImports: [value]
                        });
                    }
                    return {
                        name: property.getName(),
                        hasQuestionToken: property.hasQuestionToken(),
                        type: typeStrFixed
                    };
                })
            });
            outputSourceFile.saveSync();
        } else if (model instanceof ClassDeclaration) {
            outputSourceFile.addClass({
                name: typeName,
                isExported: true,
                extends: extendsStr,
                properties: model.getProperties().map(property => {
                    let { imports, typeStrFixed } = ensureClassCopied(property.getType().getText());
                    for (let value of Object.values(imports)) {
                        outputSourceFile.addImportDeclaration({
                            moduleSpecifier: "./" + value + ".model",
                            namedImports: [value]
                        });
                    }
                    return {
                        name: property.getName(),
                        hasQuestionToken: property.hasQuestionToken(),
                        type: typeStrFixed,
                        initializer: property.getInitializer()?.getText()
                    };
                })
            });
            outputSourceFile.saveSync();
        }
    }
    var typeStrFixed = typeStr.replace(/import\("([^"]+)"\)\.(\w+)/g, (_, path, typeName) => {
        return typeName;
    });
    return { imports, typeStrFixed };
}


serverMethodsFile.saveSync();
writeFileSync("./hashes.json", JSON.stringify(hashes, null, 4), "utf8");
