const { app, BrowserWindow } = require('electron');
const path = require('path');

// Prevent garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "连连看-测试版",
    icon: path.join(__dirname, 'icon.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Check if we are in development mode
  const isDev = !app.isPackaged;

  if (isDev) {
    // In dev, try to connect to Vite server
    // You might need to run `npm start` in another terminal
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built html file from dist
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    
    // Remove default menu for cleaner game look
    mainWindow.setMenu(null);
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});