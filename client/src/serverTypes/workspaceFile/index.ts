import getWorkspaceFile from "./getWorkspaceFile";
import getWorkspaceFileByPath from "./getWorkspaceFileByPath";
import getWorkspaceFileList from "./getWorkspaceFileList";
import saveWorkspaceFile from "./saveWorkspaceFile";
import saveWorkspaceFileMetadata from "./saveWorkspaceFileMetadata";
import saveWorkspaceFileName from "./saveWorkspaceFileName";
import saveWorkspaceFilePath from "./saveWorkspaceFilePath";
import searchWorkspaceFile from "./searchWorkspaceFile";
import statWorkspaceFile from "./statWorkspaceFile";
import listDirectory from "./listDirectory";
import saveWorkspaceFileContent from "./saveWorkspaceFileContent";
import deleteWorkspaceFileByPath from "./deleteWorkspaceFileByPath";
import createDirectory from "./createDirectory";
import renameWorkspaceFileByPath from "./renameWorkspaceFileByPath";
import getWorkspaceFileByPathCompiled from "./getWorkspaceFileByPathCompiled";
import getWorkspaceFileContentAndCompiledIfNewer from "./getWorkspaceFileContentAndCompiledIfNewer";

export default {
    getWorkspaceFile: getWorkspaceFile,
    getWorkspaceFileByPath: getWorkspaceFileByPath,
    getWorkspaceFileList: getWorkspaceFileList,
    saveWorkspaceFile: saveWorkspaceFile,
    saveWorkspaceFileMetadata: saveWorkspaceFileMetadata,
    saveWorkspaceFileName: saveWorkspaceFileName,
    saveWorkspaceFilePath: saveWorkspaceFilePath,
    searchWorkspaceFile: searchWorkspaceFile,
    statWorkspaceFile: statWorkspaceFile,
    listDirectory: listDirectory,
    saveWorkspaceFileContent: saveWorkspaceFileContent,
    deleteWorkspaceFileByPath: deleteWorkspaceFileByPath,
    createDirectory: createDirectory,
    renameWorkspaceFileByPath: renameWorkspaceFileByPath,
    getWorkspaceFileByPathCompiled: getWorkspaceFileByPathCompiled,
    getWorkspaceFileContentAndCompiledIfNewer: getWorkspaceFileContentAndCompiledIfNewer
};