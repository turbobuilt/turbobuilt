import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, stat, statSync, writeFileSync } from "fs";
import path, { basename, dirname, normalize } from "path";
import { CallExpression, ClassDeclaration, ExportAssignment, Expression, ExpressionWithTypeArguments, FunctionExpression, InterfaceDeclaration, ObjectLiteralElementLike, ObjectLiteralExpression, Project, PropertyAssignment, SourceFile, SyntaxKind, ts, Type } from "ts-morph";
import { Glob, serve } from "bun";
// hash
import { createHash, hash } from "crypto";
import { mkdir } from "fs/promises";


let hashes = {};
try {
    hashes = JSON.parse(readFileSync("./hashes.json", "utf8"));
} catch (err) { }

var processedFiles = new Set();

function doDirectory(dir = "") {
    var dirIndexFile = `../client/src/serverTypes${dir}/index.ts`;
    const project = new Project();
    const currentSourcePath = `src/methods${dir}`

    let dirPath = __dirname + `/src/methods${dir}`;
    let files = readdirSync(dirPath);
    let needsRedo = false;

    for (let file of files) {
        if (file.endsWith(".ts") === false) {
            continue;
        }
        let filePath = dirPath + "/" + file;
        let localFilePath = filePath.replace(process.cwd(), "")
        // console.log("File path", filePath);
        var hash = createHash("sha256").update(readFileSync(filePath, "utf-8")).digest("hex")
        // console.log(hashes[localFilePath], hash)
        if (!hashes[localFilePath] || hashes[localFilePath] !== hash) {
            // console.log("changed")
            needsRedo = true;
        }
    }
    let outputFileDir = dirname(dirIndexFile);
    try {
        let outputFiles = readdirSync(outputFileDir);
        let deleted = outputFiles.filter(item => files.indexOf(item) === -1 && item !== "index.ts" && item !== "DbObject.model.ts")
        if (deleted.length) {
            // console.log("found deleted", deleted);
        }
        for (let deletedFile of deleted) {
            rmSync(dirname(dirIndexFile) + "/" + deletedFile)
            if (!deletedFile.endsWith("index.ts")) {
                // remove it from "index.ts" import
                let indexFileData = project.addSourceFileAtPathIfExists(dirIndexFile);
                // Assuming `deletedFile` is the name of the file without the ".ts" extension
                let methodName = deletedFile.replace(/\.ts$/, '');

                if (indexFileData) {
                    // Remove the import declaration
                    const importDeclarations = indexFileData.getImportDeclarations();
                    importDeclarations.forEach(importDeclaration => {
                        if (importDeclaration.getDefaultImport()?.getText() === methodName) {
                            importDeclaration.remove();
                        }
                    });

                    // Remove the export assignment
                    const exportDeclaration = indexFileData.getDefaultExportSymbol()?.getDeclarations()[0] as ExportAssignment;
                    const exportExpression = exportDeclaration.getExpression() as ObjectLiteralExpression;
                    const property = exportExpression.getProperty(methodName);
                    if (property) {
                        property.remove();
                    }

                    // Save changes to the index file
                    indexFileData.saveSync();
                }
            }
        }
    } catch (err) {

    }
    if (!needsRedo) {
        let { hasChildDirectories } = doChildren(dir, currentSourcePath)
        if (!hasChildDirectories)
            return
    }
    project.addSourceFilesAtPaths(__dirname + `/src/methods${dir}/*.ts`);

    const serverTypesPath = normalize(__dirname + `/../client/src/serverTypes${dir}/index.ts`);

    mkdirSync(dirname(serverTypesPath), { recursive: true });

    const sourceFiles = project.getSourceFiles();
    const serverTypesProject = new Project();
    // read server methods file
    if (!existsSync(serverTypesPath)) {
        writeFileSync(serverTypesPath, "export default {};", "utf8");
    }


    let serverTypesFile = serverTypesProject.addSourceFileAtPath(serverTypesPath);
    const serverTypesDeclaration = serverTypesFile.getDefaultExportSymbol()?.getDeclarations()[0] as ExportAssignment;
    const exportDeclaration = serverTypesDeclaration.getExpression() as ObjectLiteralExpression;
    const properties = exportDeclaration.getProperties();
    let importData = {};
    for (let property of properties) {
        let initializer = (property as PropertyAssignment).getInitializer();
        if (initializer instanceof CallExpression) {
            let args = initializer.getArguments();
            let [path, name] = args.map(arg => arg.getText());
            importData[path] = name;
        }
    }
    // create/update index.ts in the directory
    if (!existsSync(dirIndexFile)) {
        mkdirSync(dirname(dirIndexFile), { recursive: true });
    }
    if (!existsSync(dirIndexFile)) {
        writeFileSync(dirIndexFile, "export default {}", "utf8");
    }
    const dirIndexSourceFile = project.addSourceFileAtPath(dirIndexFile);
    let dirIndexSourceFileModified = false;

    let dirIndexExport = dirIndexSourceFile.getDefaultExportSymbol()?.getDeclarations()?.[0] as any;
    // let dirIndexExports = dirIndexSourceFile.getExportDeclarations();
    let dirIndexExportsData = {};
    // get default export 
    if (!dirIndexExport) {
        dirIndexSourceFile.addExportAssignment({
            isExportEquals: false, // Use `false` for `export default` syntax
            expression: "{}",
        });
        dirIndexExport = dirIndexSourceFile.getDefaultExportSymbol()?.getDeclarations()[0] as any;
        console.trace("saving ", dirIndexSourceFile.getFilePath())
        dirIndexSourceFile.saveSync();
    }

    sourceFiles.forEach(sourceFile => {
        // if (!sourceFile.getFilePath().includes("getItem.ts")) {
        //     return;
        // }
        // // check if changed
        var hash = createHash("sha256").update(sourceFile.getFullText()).digest("hex");
        if (hashes[sourceFile.getFilePath().replace(process.cwd(), "")] === hash) {
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
        let methodName = basename(sourceFile.getFilePath()).replace(/\.ts$/, '');
        if (declarations?.length && declarations?.[0]?.getExpression()?.getArguments) {
            let methodName = basename(sourceFile.getFilePath()).replace(/\.ts$/, '');
            let returnType = declarations[0].getExpression().getArguments()[0].getReturnType() as Type;
            let returnTypeText = returnType.getText().replace(/Promise<(.+)>/, "$1");
            // check if { useFormData: true } is passed
            let options = declarations[0].getExpression().getArguments()[1];
            let useFormData = options?.getProperties().find(prop => prop.getName() === "useFormData")?.getInitializer()?.getText() === "true";
            let streamResponse = options?.getProperties().find(prop => prop.getName() === "streamResponse")?.getInitializer()?.getText() === "true";
            let outputPath = `../client/src/serverTypes${dir}/${methodName}.ts`;
            if (!existsSync(dirname(outputPath))) {
                mkdirSync(dirname(outputPath), { recursive: true });
            }
            let updirs = dir.split("/").slice(1).map(() => "../").join("");
            let params = declarations[0].getExpression().getArguments()[0].getParameters().slice(1);
            const methodIdentifier = `${dir}/${methodName}`.replace(/\//g, ".").replace(/^\./, "");
            const outputSourceFile = project.createSourceFile(outputPath, {
                statements: writer => {
                    writer.writeLine(
                        `import callMethod from "../${updirs}lib/callMethod";

export default function ${methodName}(${params.map(param => param.getText()).join(", ")}) {
    return callMethod("${methodIdentifier}", [...arguments]${(useFormData || streamResponse) ? `, { ${useFormData ? 'useFormData: true' : ''}${useFormData && streamResponse ? ', ' : ''}${streamResponse ? 'streamResponse: true' : ''} }` : ''}) as Promise<{ error?: string, data: ${returnTypeText.replace(/Promise<(.+)>/, "$1").replace(/import\\(.+?\\)\\./g, "")} }>;
};`);
                }
            }, { overwrite: true });

            importType(returnType, project, sourceFile, outputSourceFile);

            let importPath = `./${methodName}`;
            const dirIndexExportExpression = dirIndexExport.getExpression() as ObjectLiteralExpression;
            // Add the new property if it's not there already
            if (!dirIndexExportExpression.getProperty(methodName)) {
                dirIndexSourceFile.addImportDeclaration({
                    moduleSpecifier: importPath,
                    defaultImport: methodName
                })
                dirIndexExportExpression.addPropertyAssignment({
                    name: methodName,
                    initializer: methodName,
                });
                dirIndexSourceFileModified = true;
            }
            // console.trace("saving", outputSourceFile.getFilePath())
            outputSourceFile.saveSync();
        }

        // now dump regular exports (classes)
        let exports = sourceFile.getExportedDeclarations();
        for (let exported of exports) {
            if (exported[0] === "default")
                continue;
            // ensureClassCopied(exported[0])
            if (exported[1][0] instanceof ClassDeclaration) {
                console.log("Copying class")
                var declaration: ClassDeclaration = exported[1][0];
                let typeName = exported[0];
                const outputSourceFile = project.createSourceFile(`../client/src/serverTypes${dir}/${typeName}.model.ts`, {}, { overwrite: true });
                let extendsInfo = declaration.getExtends()?.getType()
                let extendsStr = extendsInfo?.getText();
                if (extendsStr && extendsInfo) {
                    importType(extendsInfo, project, sourceFile, outputSourceFile);
                }

                outputSourceFile.addClass({
                    name: typeName,
                    isExported: true,
                    extends: declaration.getExtends()?.getText(),
                    properties: declaration.getProperties().map(property => {
                        importType(property.getType(), project, sourceFile, outputSourceFile);
                        return {
                            name: property.getName(),
                            hasQuestionToken: property.hasQuestionToken(),
                            type: getTypeName(property.getType()),
                            initializer: property.getInitializer()?.getText()
                        };
                    })
                });
                // console.trace("saving", outputSourceFile.getFilePath())
                outputSourceFile.saveSync();
            }
        }

        hashes[sourceFile.getFilePath().replace(process.cwd(), "")] = createHash("sha256").update(sourceFile.getFullText()).digest("hex");
    });
    // console.trace("saving", serverTypesFile.getFilePath())
    // serverTypesFile.saveSync();
    doChildren(dir, currentSourcePath);

    // read dirs and add to dire index source file
    let entries = readdirSync(dirname(dirIndexFile));
    for (let dir of entries) {
        if (dir.includes(".")) {
            continue;
        }
        let importPath = `./${dir}`;
        const expression = dirIndexExport.getExpression() as ObjectLiteralExpression;
        if (!dirIndexExportsData[dir]) {
            // check if exists
            if (expression.getProperty(dir)) {
                continue;
            }
            dirIndexSourceFile.addImportDeclaration({
                moduleSpecifier: importPath,
                defaultImport: dir
            })
            expression.addPropertyAssignment({
                name: dir,
                initializer: dir,
            });
            dirIndexSourceFileModified = true;
        }
    }
    if (dirIndexSourceFileModified) {
        // console.trace("saving", dirIndexSourceFile.getFilePath())
        dirIndexSourceFile.saveSync();
    }
}
doDirectory()
writeFileSync("./hashes.json", JSON.stringify(hashes, null, 4), "utf8");

function doChildren(dir, currentSourcePath) {
    let children = readdirSync(currentSourcePath);
    let hasChildDirectories = false;
    for (let child of children) {
        if (child.includes(".")) {
            continue;
        }
        if (statSync(currentSourcePath + "/" + child).isDirectory()) {
            hasChildDirectories = true;
            doDirectory(`${dir}/${child}`);
        }
    }
    return { hasChildDirectories };
}

function importType(type: Type, project: Project, currentFile: SourceFile, outputFile: SourceFile) {
    let fullTypeStr = type.getText();
    if (fullTypeStr.indexOf("import") === -1) {
        return;
    }
    if (fullTypeStr.startsWith("typeof")) {
        const baseType = type.getSymbolOrThrow().getDeclarations()[0].getType();
        importType(baseType, project, currentFile, outputFile);
        return;
    }
    // if (fullTypeStr.startsWith("Array<")) {
    //     console.log("start with array")
    //     const arrayType = type.getTypeArguments()[0];
    //     importType(arrayType, project, currentFile, outputFile);
    //     return
    // }
    // check if is promise
    if (fullTypeStr.startsWith("Promise<")) {
        const promiseType = type.getTypeArguments()[0];
        importType(promiseType, project, currentFile, outputFile);
        return;
    } else if (type.isUnion()) {
        const unionTypes = type.getUnionTypes();
        unionTypes.forEach(unionType => {
            importType(unionType, project, currentFile, outputFile);
        });
        return;
    } else if (type.isArray()) {
        const arrayType = type.getArrayElementTypeOrThrow();
        importType(arrayType, project, currentFile, outputFile);
        return;
    } else if (type.isObject() && fullTypeStr.startsWith("import") === false) {
        const properties = type.getProperties();
        properties.forEach(prop => {
            const propType = prop.getTypeAtLocation(currentFile);
            importType(propType, project, currentFile, outputFile);
        });
        return;
    }
    // check if is built in
    if (type.isString() || type.isNumber() || type.isBoolean()) {
        return;
    }
    // check if is array
    if (type.isArray()) {
        importType(type.getArrayElementType()!, project, currentFile, outputFile);
        return;
    }


    console.log("full type str is", fullTypeStr)
    let filePath = fullTypeStr.match(/import\("(.+)"\)/)?.[1];
    console.log("file path", filePath)
    console.log("ensuring class copied", fullTypeStr)
    let typeStr = getTypeName(type);
    if (!typeStr) {
        console.error("no type str", type.getText())
        process.exit(1);
        return;
    }

    let importPathAbsolute = fullTypeStr.match(/import\("(.+)"\)/)?.[1];
    if (!importPathAbsolute) {
        return;
    }
    console.log("import path absolute", importPathAbsolute, "type str", typeStr)
    // let importPath = currentFile.getRelativePathAsModuleSpecifierTo(importPathAbsolute);
    let importPath = path.relative(dirname(currentFile.getFilePath()), importPathAbsolute)
    console.log("current file path", currentFile.getFilePath());
    console.log("Import path", importPath)

    if (importPath.indexOf("../lib/") > -1) {
        importPath = importPath.replace("../lib/", "");
    }
    if (importPath.startsWith(".") === false && importPath.startsWith("/") === false) {
        importPath = "./" + importPath;
    }


    if (fullTypeStr.endsWith(".default")) {
        // import it
        outputFile.addImportDeclaration({
            moduleSpecifier: importPath,
            defaultImport: typeStr
        });
    } else {
        console.log("importing", importPath, typeStr, "to", outputFile.getFilePath())
        // import it
        outputFile.addImportDeclaration({
            moduleSpecifier: importPath,
            namedImports: [typeStr]
        });
    }

    if (processedFiles.has(fullTypeStr)) {
        console.log("not doing bc import path hash not changed")
        outputFile.saveSync();
        return;
    } else if (hashes[importPathAbsolute]) {
        console.log("not doing bc import path hash not changed")
        outputFile.saveSync();
        return;
    }
    processedFiles.add(fullTypeStr);
    console.log("importing", importPathAbsolute, "From", currentFile.getFilePath())
    let sourceFile = project.addSourceFileAtPath(importPathAbsolute + ".ts");
    let model = sourceFile.getExportedDeclarations()?.get(typeStr)?.[0] as InterfaceDeclaration | ClassDeclaration;
    if (!(model instanceof InterfaceDeclaration) && !(model instanceof ClassDeclaration)) {
        console.log("not a class or interface", typeStr)
        return;
    }
    let outputPath = importPathAbsolute.split("server/src/methods/")[1];
    if (!outputPath) {
        outputPath = "";
    } else {
        outputPath = dirname(outputPath);
    }

    console.log("output path is", outputPath)
    const outputSourceFile = project.createSourceFile(`../client/src/serverTypes/${outputPath}/${typeStr}.model.ts`, {}, { overwrite: true });
    let extendsStr;

    let extendsDeclaration = model?.getExtends() as ExpressionWithTypeArguments[] | ExpressionWithTypeArguments;
    if (extendsDeclaration && !Array.isArray(extendsDeclaration)) {
        let extendsType = extendsDeclaration.getExpression().getType().getText()?.replace(/typeof /, '');
        importType(extendsDeclaration.getExpression().getType(), project, currentFile, outputSourceFile);
        extendsStr = extendsDeclaration.getText();
    }
    if (model instanceof InterfaceDeclaration) {
        outputSourceFile.addInterface({
            name: typeStr,
            isExported: true,
            extends: extendsStr,
            properties: model.getProperties().map(property => {
                importType(property.getType(), project, currentFile, outputSourceFile);
                return {
                    name: property.getName(),
                    hasQuestionToken: property.hasQuestionToken(),
                    type: property.getType().getText(),
                };
            })
        });
        // console.trace("saving ", outputSourceFile.getFilePath())
        outputSourceFile.saveSync();
    } else if (model instanceof ClassDeclaration) {
        outputSourceFile.addClass({
            name: typeStr,
            isExported: true,
            extends: extendsStr,
            properties: model.getProperties().map(property => {
                importType(property.getType(), project, currentFile, outputSourceFile);
                return {
                    name: property.getName(),
                    hasQuestionToken: property.hasQuestionToken(),
                    type: property.getType().getText(),
                    initializer: property.getInitializer()?.getText()
                };
            })
        });
        // console.trace("saving ", outputSourceFile.getFilePath())
        outputSourceFile.saveSync();
    }
}


function getTypeName(type: Type) {
    let typeStr = type.getText();
    if (!typeStr.startsWith("import"))
        return typeStr
    if (typeStr.endsWith(".default")) {
        return typeStr.match(/import\("([^"]+)"\)\.default/)?.[1];
    } else {
        return typeStr.match(/import\("([^"]+)"\)\.(\w+)/)?.[2];
    }
}