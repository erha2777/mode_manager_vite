"use strict";
const electron = require("electron");
const os = require("os");
const path = require("path");
const fs = require("fs");
console.debug("platform", os.platform());
electron.contextBridge.exposeInMainWorld("dialogApi", {
  showOpenDialog: (options) => {
    return new Promise((resolve, reject) => {
      electron.ipcRenderer.send("show-open-dialog", options);
      electron.ipcRenderer.on("open-dialog-result", (_event, result) => {
        resolve(result);
      });
      electron.ipcRenderer.on("open-dialog-error", (_event, result) => {
        reject(result);
      });
    });
  }
});
const exposedFsMethods = {
  readFile: (...args) => {
    return fs.readFile(args[0], args[1], args[2]);
  },
  writeFile: (...args) => {
    return fs.writeFile(args[0], args[1], args[2], args[3]);
  },
  opendirSync: (...args) => {
    return fs.promises.opendir(args[0]);
  },
  readdirSync: (...args) => {
    return fs.readdirSync(args[0]);
  },
  readFileSync: (...args) => {
    return fs.readFileSync(args[0], args[1]);
  },
  statSync: (...args) => {
    return fs.statSync(args[0]);
  },
  isDirectory: (...args) => {
    const stat = fs.statSync(args[0]);
    return stat.isDirectory();
  },
  existsSync: (...args) => {
    return fs.existsSync(args[0]);
  },
  symlinkSync: async (...args) => {
    return fs.symlinkSync(args[0], args[1], args[2]);
  },
  isSymbolicLink: (...args) => {
    let stats = fs.lstatSync(args[0]);
    return stats.isSymbolicLink();
  },
  unlinkSync: (...args) => {
    return fs.unlinkSync(args[0]);
  }
};
electron.contextBridge.exposeInMainWorld("fsApi", exposedFsMethods);
const exposedPathMethods = {
  normalize: (...args) => {
    return path.normalize(args[0]);
  },
  join: (...args) => {
    return path.join(args[0], args[1]);
  }
};
electron.contextBridge.exposeInMainWorld("pathApi", exposedPathMethods);
const exposedWindowMethods = {
  close: () => {
    electron.ipcRenderer.send("window-close");
  }
};
electron.contextBridge.exposeInMainWorld("windowApi", exposedWindowMethods);
const exposedImgMethods = {
  getImgBase64: (path2) => {
    let image = electron.nativeImage.createFromPath(path2);
    return image.toDataURL();
  }
};
electron.contextBridge.exposeInMainWorld("imgApi", exposedImgMethods);
