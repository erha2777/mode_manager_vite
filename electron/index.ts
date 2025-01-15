// electron-main/index.ts

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
const createWindow = () => {
    const mainWindow = new BrowserWindow({
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
            contextIsolation: true, // 是否开启隔离上下文
            nodeIntegration: true, // 渲染进程使用Node API
            preload: path.join(__dirname, './preload.js'), // 需要引用js文件
            webSecurity: false
        },
    })

    // 如果打包了，渲染index.html

    if (process.env.NODE_ENV !== 'development') {
        mainWindow.loadFile(path.join(__dirname, './index.html'))
        mainWindow.webContents.openDevTools()
    } else {
        let url = 'http://localhost:5173' // 本地启动的vue项目路径。注意：vite版本3以上使用的端口5173；版本2用的是3000

        mainWindow.loadURL(url)

        mainWindow.webContents.openDevTools()
    }

    ipcMain.on('show-open-dialog', async (event, options) => {
        dialog.showOpenDialog(mainWindow, options).then((res: any) => {
            event.reply('open-dialog-result', res);
        }).catch((err) => {
            event.reply('open-dialog-error', err);
        })
    });
    ipcMain.on('show-dialog-request', (event, args) => {
        const { dialogType, options } = args;
        let result;
        switch (dialogType) {
            case 'openFileDialog':
                result = dialog.showOpenDialog(mainWindow, options);
                break;
            case 'saveFileDialog':
                result = dialog.showSaveDialog(mainWindow, options);
                break;
            case 'messageBox':
                result = dialog.showMessageBox(mainWindow, options);
                break;
            default:
                break;
        }
        event.reply('dialog-result', result);
    });

    // 1. 窗口 最小化
    ipcMain.on('window-min', function () { // 收到渲染进程的窗口最小化操作的通知，并调用窗口最小化函数，执行该操作
        mainWindow.minimize();
    })
    // 2. 窗口 最大化、恢复
    ipcMain.on('window-change-max', function () {
        if (mainWindow.isMaximized()) { // 为true表示窗口已最大化
            // mainWindow.restore(); // 将窗口恢复为之前的状态.
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    })

    // 3. 关闭窗口
    ipcMain.on('window-close', function () {
        mainWindow.close();
    })

    // 监听渲染进程发送的打开文件管理器的请求
    ipcMain.on('open-specific-path', (event, path) => {
        shell.openPath(path).then((res) => {
            event.reply('open-specific-path-result', res);
        }).catch((err) => {
            event.reply('open-specific-path-error', err);
        });
    });

    // 监听渲染进程发送的跳转网站的请求
    ipcMain.on('open-website', async (event, url) => {
        shell.openExternal(url).then((res) => {
            event.reply('open-website-result', res);
        }).catch((err) => {
            event.reply('open-website-error', err);
        });
    });
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
    createWindow() // 创建窗口

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
