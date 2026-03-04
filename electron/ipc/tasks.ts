import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';

export function registerTaskHandlers() {
  const db = getDb();

  ipcMain.handle('tasks:getAll', (_event, board?: string) => {
    if (board) {
      return db
        .prepare('SELECT * FROM tasks WHERE board = ? ORDER BY done ASC, position ASC')
        .all(board);
    }
    return db.prepare('SELECT * FROM tasks ORDER BY board, done ASC, position ASC').all();
  });

  ipcMain.handle('tasks:get', (_event, id: string) => {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  });

  ipcMain.handle(
    'tasks:create',
    (
      _event,
      task: { title: string; description?: string; board: string; priority: string }
    ) => {
      const id = uuidv4();
      // Get max position for the board
      const maxPos = db
        .prepare('SELECT MAX(position) as maxPos FROM tasks WHERE board = ?')
        .get(task.board) as { maxPos: number | null };
      const position = (maxPos?.maxPos ?? 0) + 1;

      db.prepare(
        `INSERT INTO tasks (id, title, description, board, priority, position)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, task.title, task.description || null, task.board, task.priority, position);

      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    }
  );

  ipcMain.handle(
    'tasks:update',
    (_event, id: string, updates: Record<string, unknown>) => {
      const allowed = ['title', 'description', 'priority', 'board', 'position'];
      const fields: string[] = [];
      const values: unknown[] = [];

      for (const key of allowed) {
        if (key in updates) {
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      }

      if (fields.length === 0) return null;

      fields.push(`updated_at = datetime('now')`);
      values.push(id);

      db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    }
  );

  ipcMain.handle('tasks:delete', (_event, id: string) => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('tasks:toggle', (_event, id: string) => {
    db.prepare(
      `UPDATE tasks SET done = NOT done, updated_at = datetime('now') WHERE id = ?`
    ).run(id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  });

  ipcMain.handle('tasks:move', (_event, id: string, board: string) => {
    // Get max position in target board
    const maxPos = db
      .prepare('SELECT MAX(position) as maxPos FROM tasks WHERE board = ?')
      .get(board) as { maxPos: number | null };
    const position = (maxPos?.maxPos ?? 0) + 1;

    db.prepare(
      `UPDATE tasks SET board = ?, position = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(board, position, id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  });

  ipcMain.handle('tasks:reorder', (_event, id: string, newPosition: number) => {
    db.prepare(
      `UPDATE tasks SET position = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(newPosition, id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  });

  ipcMain.handle('tasks:search', (_event, query: string) => {
    const pattern = `%${query}%`;
    return db
      .prepare('SELECT * FROM tasks WHERE title LIKE ? ORDER BY board, position ASC')
      .all(pattern);
  });

  ipcMain.handle('tasks:deleteOlderThan', (_event, days: number) => {
    const result = db
      .prepare(
        `DELETE FROM tasks WHERE created_at < datetime('now', ? || ' days')`
      )
      .run(`-${days}`);
    return { deleted: result.changes };
  });
}
