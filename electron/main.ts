import { app, BrowserWindow, ipcMain } from 'electron';
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
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Fast & Focus',
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

  // App info handler
  ipcMain.handle('app:getInfo', () => ({
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
  }));

  createWindow();
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
