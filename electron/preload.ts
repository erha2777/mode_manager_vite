// electron-preload/preload.ts
import { contextBridge, ipcRenderer, nativeImage } from 'electron'
import os from "os";
import path from "path";
import fs from "fs";

console.debug("platform", os.platform());
// console.debug("contextBridge", contextBridge);


contextBridge.exposeInMainWorld('dialogApi', {
    showOpenDialog: (options: any) => {
        return new Promise((resolve, reject) => {
            ipcRenderer.send('show-open-dialog', options);
            ipcRenderer.on('open-dialog-result', (_event, result) => {
                resolve(result);
            });
            ipcRenderer.on('open-dialog-error', (_event, result) => {
                reject(result);
            });
        });
    }
});


const exposedFsMethods = {
    readFile: (...args: any[]) => {
        return fs.readFile(args[0], args[1], args[2])
    },
    writeFile: (...args: any[]) => {
        return fs.writeFile(args[0], args[1], args[2], args[3])
    },
    opendirSync: (...args: any[]) => {
        return fs.promises.opendir(args[0])
    },
    readdirSync: (...args: any[]) => {
        return fs.readdirSync(args[0])
    },
    readFileSync: (...args: any[]) => {
        return fs.readFileSync(args[0], args[1])
    },
    statSync: (...args: any[]) => {
        return fs.statSync(args[0])
    },
    isDirectory: (...args: any[]) => {
        const stat = fs.statSync(args[0])
        return stat.isDirectory()
    },
    existsSync: (...args: any[]) => {
        return fs.existsSync(args[0])
    },
    symlinkSync: async (...args: any[]) => {
        return fs.symlinkSync(args[0], args[1], args[2])
    },
    isSymbolicLink: (...args: any[]) => {
        let stats = fs.lstatSync(args[0])
        return stats.isSymbolicLink()
    },
    unlinkSync: (...args: any[]) => {
        return fs.unlinkSync(args[0])
    },
};
contextBridge.exposeInMainWorld('fsApi', exposedFsMethods);

const exposedPathMethods = {
    normalize: (...args: any[]) => {
        return path.normalize(args[0])
    },
    join: (...args: any[]) => {
        return path.join(args[0], args[1])
    },
}
contextBridge.exposeInMainWorld('pathApi', exposedPathMethods);


const exposedWindowMethods = {
    close: () => {
        ipcRenderer.send('window-close')
    },
}
contextBridge.exposeInMainWorld('windowApi', exposedWindowMethods);


const exposedImgMethods = {
    getImgBase64: (path: any) => {
        let image = nativeImage.createFromPath(path);
        return image.toDataURL()
    },
}
contextBridge.exposeInMainWorld('imgApi', exposedImgMethods);