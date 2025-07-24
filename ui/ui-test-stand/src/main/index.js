import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');

let port = null;
let parser = null;
let webContents = null;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false, // Do NOT use nodeIntegration!
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('append-line', (event, filePath, line) => {
    fs.appendFile(filePath, line + '\n', (err) => {
      if (err) {
        console.error('Failed to write line to file:', err);
      }
    });
  });

  // Handle serial port list
  ipcMain.handle('serial:list', async () => {
    return await SerialPort.list();
  });

  // Handle serial port open/write
  ipcMain.handle('serial:open', async (_event, path, baudRate) => {
    if (port && port.isOpen) port.close();

    return new Promise((resolve, reject) => {
      port = new SerialPort({ path, baudRate }, (err) => {
        if (err) {
          reject(err.message);
        } else {
          // Optional parser to get lines
          parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

          parser.on('data', (data) => {
            if (webContents) {
              webContents.send('serial:data', data); // emit to renderer
            }
          });

          resolve('Port opened');
        }
      });
    });
  });

  ipcMain.handle('serial:write', async (_event, data) => {
    return new Promise((resolve, reject) => {
      if (!port || !port.isOpen) return reject('Port is not open');
      port.write(data, (err) => {
        if (err) reject(err.message);
        else resolve('Data written');
      });
    });
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
