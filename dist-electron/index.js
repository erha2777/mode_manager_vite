"use strict";
const electron = require("electron");
const path = require("path");
const createWindow = () => {
  const mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    // 无边框窗口
    frame: false,
    // 是否自动隐藏菜单栏(按alt显示 设置了无边框不可使用) 
    autoHideMenuBar: true,
    // 要将此脚本附加到渲染过程中，要将预加载脚本的路径传递到webPreferences。在现有的BrowserWindow构造函数中的预加载选项
    webPreferences: {
      contextIsolation: true,
      // 是否开启隔离上下文
      nodeIntegration: true,
      // 渲染进程使用Node API
      preload: path.join(__dirname, "./preload.js"),
      // 需要引用js文件
      webSecurity: false
    }
  });
  if (process.env.NODE_ENV !== "development") {
    mainWindow.loadFile(path.join(__dirname, "./index.html"));
    mainWindow.webContents.openDevTools();
  } else {
    let url = "http://localhost:5173";
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  }
  electron.ipcMain.on("show-open-dialog", async (event, options) => {
    electron.dialog.showOpenDialog(mainWindow, options).then((res) => {
      event.reply("open-dialog-result", res);
    }).catch((err) => {
      event.reply("open-dialog-error", err);
    });
  });
  electron.ipcMain.on("show-dialog-request", (event, args) => {
    const { dialogType, options } = args;
    let result;
    switch (dialogType) {
      case "openFileDialog":
        result = electron.dialog.showOpenDialog(mainWindow, options);
        break;
      case "saveFileDialog":
        result = electron.dialog.showSaveDialog(mainWindow, options);
        break;
      case "messageBox":
        result = electron.dialog.showMessageBox(mainWindow, options);
        break;
    }
    event.reply("dialog-result", result);
  });
  electron.ipcMain.on("window-min", function() {
    mainWindow.minimize();
  });
  electron.ipcMain.on("window-max", function() {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  });
  electron.ipcMain.on("window-close", function() {
    mainWindow.close();
  });
};
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
