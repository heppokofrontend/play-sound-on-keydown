const {app, BrowserWindow, globalShortcut, shell} = require('electron');
const path = require('path');
const ioHook = require('iohook');
const createWindow = () => {
  const win = new BrowserWindow({
    width: 868,
    height: 651,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  win.setMenu(null);
  win.webContents.setWindowOpenHandler(({url}) => {
    if ( url.match(/^http/)) {
      shell.openExternal(url);
    }

    return {action: 'deny'};
  });
  // win.webContents.openDevTools();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(async () => {
  ioHook.on('keypress', (event) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('keypress', event);
    });
  });
  ioHook.start();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  ioHook.stop();
});
