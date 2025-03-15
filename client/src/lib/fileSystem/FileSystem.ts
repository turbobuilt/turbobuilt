import { checkAndShowHttpError } from "../checkAndShowHttpError";
import { serverMethods } from "../serverMethods";

const dbName = 'turbobuilt_filesystem';
const storeName = 'WorkspaceFile';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(dbName, 1);
        request.onerror = () => reject('Database error');

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const objectStore = db.createObjectStore(storeName, { keyPath: 'path' });
            objectStore.createIndex('pathIndex', 'path', { unique: true });
            objectStore.createIndex('updated', 'updated');
        };

        request.onsuccess = () => resolve(request.result);
    });
}

export class FileSystem {
    static async getFile(path: string) : Promise<{ exists?: boolean } & { updated?: string, content?: Uint8Array, compiled?: Uint8Array }> {
        const db = await openDB();
        return new Promise(async (resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const index = objectStore.index('pathIndex');
            const request = index.get(path);

            request.onsuccess = async () => {
                const cachedFile = request.result;
                const fileResult = await serverMethods.workspaceFile.getWorkspaceFileContentAndCompiledIfNewer(
                    path,
                    cachedFile ? cachedFile.updated : null
                );
                if (fileResult.data.exists === false) {
                    resolve({ exists: false });
                    return;
                }
                if (fileResult.data.newContent === false) {
                    resolve({
                        updated: cachedFile.updated,
                        content: cachedFile.content,
                        compiled: cachedFile.compiled
                    });
                    return;
                }
                const [updatedBuffer, contentBuffer, compiledBuffer] = fileResult.data;
                let updated = new TextDecoder().decode(updatedBuffer);
                await FileSystem.saveFileLocally(path, contentBuffer, compiledBuffer, updated);
                resolve({ updated, content: contentBuffer, compiled: compiledBuffer });
            };

            request.onerror = () => reject('File not found');
        });
    }

    static async createDirectory(path) {
        throw new Error("Not implemented, currently going directly to server");
    }

    static async saveFileLocally(
        path: string,
        content: ArrayBuffer,
        compiled?: any,
        updated?: string
    ): Promise<void> {
        const db = await openDB();
        const quota = await navigator.storage.estimate();
        const totalSpace = Math.min(quota.quota || 0, 11 * 1024 * 1024);
        const usedSpace = quota.usage || 0;
        const bufferSpace = 1 * 1024 * 1024;
        const contentSize = content.byteLength;

        if (usedSpace + contentSize + bufferSpace > totalSpace) {
            await FileSystem.purgeOldestItems(db, usedSpace + contentSize + bufferSpace - totalSpace);
        }
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const fileRecord = {
            updated,
            path,
            size: contentSize,
            content,
            compiled
        };
        objectStore.put(fileRecord);
    }

    static async saveFile(path: string, content: ArrayBuffer, compiled?: any, dependencies?: Set<string>|string[]) {
        let dependenciesBinary = new TextEncoder().encode(JSON.stringify(Array.from(dependencies)));
        console.log("Saving, dependencies", dependencies);
        let result = await serverMethods.workspaceFile.saveWorkspaceFileContent(path, content, compiled, dependenciesBinary);
        await FileSystem.saveFileLocally(path, content, compiled, result.data.workspaceFile.updated);
        return result;
    }

    static async renameFile(oldPath: string, newPath: string) {
        let result = await serverMethods.workspaceFile.renameWorkspaceFileByPath(oldPath, newPath);
        if (checkAndShowHttpError(result)) return result;
        const db = await openDB();
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const index = objectStore.index('pathIndex');
        const request = index.get(oldPath);

        request.onsuccess = () => {
            const fileRecord = request.result;
            if (fileRecord) {
                objectStore.delete(oldPath);
                fileRecord.path = newPath;
                objectStore.put(fileRecord);
            }
        };
        return result;
    }

    static async deleteFile(path: string) {
        console.log("deleting at path", path);
        let result = await serverMethods.workspaceFile.deleteWorkspaceFileByPath(path);
        console.log("delete result", result);
        const db = await openDB();
        const transaction = db.transaction([storeName], 'readwrite');
        const request = transaction.objectStore(storeName).delete(path);

        request.onsuccess = () => {
            console.log(`File at path ${path} deleted successfully from IndexedDB`);
        };

        request.onerror = () => {
            console.error(`Failed to delete file at path ${path} from IndexedDB`);
        };

        return result;
    }

    private static async purgeOldestItems(db: IDBDatabase, spaceNeeded: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const index = objectStore.index('updated');
            const request = index.openCursor();
            let freedSpace = 0;

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor && freedSpace < spaceNeeded) {
                    freedSpace += cursor.value.size;
                    objectStore.delete(cursor.primaryKey);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject('Error purging items');
        });
    }
}
