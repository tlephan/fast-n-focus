import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import { getDb } from '../database';

interface ExportData {
  version: number;
  exportedAt: string;
  tasks: unknown[];
  taskLinks: unknown[];
}

function isValidExport(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    Array.isArray(d.tasks) &&
    Array.isArray(d.taskLinks)
  );
}

export function registerDataHandlers() {
  const db = getDb();

  ipcMain.handle('data:export', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const { canceled, filePath } = await dialog.showSaveDialog(win!, {
      title: 'Export Data',
      defaultPath: `fastnfocus-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (canceled || !filePath) return { success: false };

    const tasks = db.prepare('SELECT * FROM tasks').all();
    const taskLinks = db.prepare('SELECT * FROM task_links').all();

    const payload: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      taskLinks,
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return { success: true };
  });

  ipcMain.handle('data:import', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
      title: 'Import Data',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) return { success: false };

    const raw = fs.readFileSync(filePaths[0], 'utf-8');
    const data = JSON.parse(raw);

    if (!isValidExport(data)) {
      throw new Error('Invalid backup file format');
    }

    const VALID_BOARDS = ['today', 'backlog'];
    const VALID_PRIORITIES = ['high', 'medium', 'low'];
    const VALID_LINK_TYPES = ['related', 'blocks', 'blocked_by'];
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const doImport = db.transaction(() => {
      db.prepare('DELETE FROM task_links').run();
      db.prepare('DELETE FROM tasks').run();

      const insertTask = db.prepare(
        `INSERT INTO tasks (id, title, description, done, board, priority, position, created_at, updated_at)
         VALUES (@id, @title, @description, @done, @board, @priority, @position, @created_at, @updated_at)`
      );

      for (const t of data.tasks as Record<string, unknown>[]) {
        if (
          typeof t.id !== 'string' || !UUID_RE.test(t.id) ||
          typeof t.title !== 'string' || t.title.length === 0 ||
          !VALID_BOARDS.includes(t.board as string) ||
          !VALID_PRIORITIES.includes(t.priority as string)
        ) {
          throw new Error('Invalid task data in backup');
        }
        insertTask.run({
          id: t.id,
          title: t.title,
          description: t.description ?? null,
          done: t.done ?? 0,
          board: t.board,
          priority: t.priority,
          position: t.position ?? 0,
          created_at: t.created_at ?? new Date().toISOString(),
          updated_at: t.updated_at ?? new Date().toISOString(),
        });
      }

      const insertLink = db.prepare(
        `INSERT INTO task_links (id, source_task_id, target_task_id, type, created_at)
         VALUES (@id, @source_task_id, @target_task_id, @type, @created_at)`
      );

      for (const l of data.taskLinks as Record<string, unknown>[]) {
        if (
          typeof l.id !== 'string' || !UUID_RE.test(l.id) ||
          typeof l.source_task_id !== 'string' || !UUID_RE.test(l.source_task_id) ||
          typeof l.target_task_id !== 'string' || !UUID_RE.test(l.target_task_id) ||
          !VALID_LINK_TYPES.includes(l.type as string)
        ) {
          throw new Error('Invalid task link data in backup');
        }
        insertLink.run({
          id: l.id,
          source_task_id: l.source_task_id,
          target_task_id: l.target_task_id,
          type: l.type,
          created_at: l.created_at ?? new Date().toISOString(),
        });
      }
    });

    doImport();
    return { success: true, taskCount: data.tasks.length };
  });
}
