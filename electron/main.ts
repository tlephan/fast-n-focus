import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDb } from './database';
import { registerTaskHandlers } from './ipc/tasks';
import { registerTaskLinkHandlers } from './ipc/taskLinks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const iconPath = VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public/icon.png')
    : path.join(__dirname, '../dist/icon.png');

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'Fast & Focus',
    icon: iconPath,
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'fastnfocus.db');
  initDatabase(dbPath);

  // Auto-cleanup: purge tasks older than 30 days
  const db = getDb();
  db.prepare(`DELETE FROM tasks WHERE created_at < datetime('now', '-30 days')`).run();

  registerTaskHandlers();
  registerTaskLinkHandlers();

  // Open external URL in default browser
  ipcMain.handle('app:openExternal', (_event, url: string) => {
    const allowed = ['https://github.com/tlephan/fast-n-focus'];
    if (allowed.includes(url)) shell.openExternal(url);
  });

  // App info handler
  ipcMain.handle('app:getInfo', () => ({
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
  }));

  createWindow();

  if (process.platform === 'darwin') {
    const iconPath = VITE_DEV_SERVER_URL
      ? path.join(__dirname, '../public/icon.png')
      : path.join(__dirname, '../dist/icon.png');
    app.dock.setIcon(iconPath);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
