import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import {
  assertUuid,
  assertBoard,
  assertPriority,
  assertText,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_SEARCH_LENGTH,
} from './validate';

export function registerTaskHandlers() {
  const db = getDb();

  ipcMain.handle('tasks:getAll', (_event, board?: string) => {
    try {
      if (board !== undefined) {
        assertBoard(board);
        return db
          .prepare('SELECT * FROM tasks WHERE board = ? ORDER BY done ASC, position ASC')
          .all(board);
      }
      return db.prepare('SELECT * FROM tasks ORDER BY board, done ASC, position ASC').all();
    } catch (err) {
      console.error('[tasks:getAll]', err);
      throw new Error('Failed to fetch tasks');
    }
  });

  ipcMain.handle('tasks:get', (_event, id: string) => {
    try {
      assertUuid(id);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    } catch (err) {
      console.error('[tasks:get]', err);
      throw new Error('Failed to fetch task');
    }
  });

  ipcMain.handle(
    'tasks:create',
    (
      _event,
      task: { title: string; description?: string; board: string; priority: string }
    ) => {
      try {
        assertText(task.title, 'title', MAX_TITLE_LENGTH);
        assertBoard(task.board);
        assertPriority(task.priority);
        if (task.description !== undefined && task.description !== null) {
          if (typeof task.description !== 'string' || task.description.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
          }
        }

        const id = uuidv4();
        const maxPos = db
          .prepare('SELECT MAX(position) as maxPos FROM tasks WHERE board = ?')
          .get(task.board) as { maxPos: number | null };
        const position = (maxPos?.maxPos ?? 0) + 1;

        db.prepare(
          `INSERT INTO tasks (id, title, description, board, priority, position)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(id, task.title, task.description || null, task.board, task.priority, position);

        return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      } catch (err) {
        console.error('[tasks:create]', err);
        throw err instanceof Error ? err : new Error('Failed to create task');
      }
    }
  );

  ipcMain.handle(
    'tasks:update',
    (_event, id: string, updates: Record<string, unknown>) => {
      try {
        assertUuid(id);
        const allowed = ['title', 'description', 'priority', 'board', 'position'];
        const fields: string[] = [];
        const values: unknown[] = [];

        for (const key of allowed) {
          if (!(key in updates)) continue;
          const val = updates[key];

          if (key === 'title') assertText(val, 'title', MAX_TITLE_LENGTH);
          if (key === 'description') {
            if (val !== null && val !== undefined) {
              if (typeof val !== 'string' || val.length > MAX_DESCRIPTION_LENGTH) {
                throw new Error(`description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
              }
            }
          }
          if (key === 'board') assertBoard(val);
          if (key === 'priority') assertPriority(val);
          if (key === 'position') {
            if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
              throw new Error('position must be a non-negative integer');
            }
          }

          fields.push(`${key} = ?`);
          values.push(val);
        }

        if (fields.length === 0) return null;

        fields.push(`updated_at = datetime('now')`);
        values.push(id);

        db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      } catch (err) {
        console.error('[tasks:update]', err);
        throw err instanceof Error ? err : new Error('Failed to update task');
      }
    }
  );

  ipcMain.handle('tasks:delete', (_event, id: string) => {
    try {
      assertUuid(id);
      db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
      return { success: true };
    } catch (err) {
      console.error('[tasks:delete]', err);
      throw new Error('Failed to delete task');
    }
  });

  ipcMain.handle('tasks:toggle', (_event, id: string) => {
    try {
      assertUuid(id);
      db.prepare(
        `UPDATE tasks SET done = NOT done, updated_at = datetime('now') WHERE id = ?`
      ).run(id);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    } catch (err) {
      console.error('[tasks:toggle]', err);
      throw new Error('Failed to toggle task');
    }
  });

  ipcMain.handle('tasks:move', (_event, id: string, board: string) => {
    try {
      assertUuid(id);
      assertBoard(board);

      const maxPos = db
        .prepare('SELECT MAX(position) as maxPos FROM tasks WHERE board = ?')
        .get(board) as { maxPos: number | null };
      const position = (maxPos?.maxPos ?? 0) + 1;

      db.prepare(
        `UPDATE tasks SET board = ?, position = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(board, position, id);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    } catch (err) {
      console.error('[tasks:move]', err);
      throw err instanceof Error ? err : new Error('Failed to move task');
    }
  });

  ipcMain.handle('tasks:reorder', (_event, id: string, newPosition: number) => {
    try {
      assertUuid(id);
      if (typeof newPosition !== 'number' || !Number.isInteger(newPosition) || newPosition < 0) {
        throw new Error('newPosition must be a non-negative integer');
      }
      db.prepare(
        `UPDATE tasks SET position = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(newPosition, id);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    } catch (err) {
      console.error('[tasks:reorder]', err);
      throw err instanceof Error ? err : new Error('Failed to reorder task');
    }
  });

  ipcMain.handle('tasks:search', (_event, query: string) => {
    try {
      assertText(query, 'query', MAX_SEARCH_LENGTH);
      const pattern = `%${query}%`;
      return db
        .prepare('SELECT * FROM tasks WHERE title LIKE ? ORDER BY board, position ASC')
        .all(pattern);
    } catch (err) {
      console.error('[tasks:search]', err);
      throw err instanceof Error ? err : new Error('Failed to search tasks');
    }
  });

  ipcMain.handle('tasks:deleteOlderThan', (_event, days: number) => {
    try {
      if (!Number.isInteger(days) || days <= 0 || days > 36500) {
        throw new Error('days must be an integer between 1 and 36500');
      }
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const result = db.prepare('DELETE FROM tasks WHERE created_at < ?').run(cutoff);
      return { deleted: result.changes };
    } catch (err) {
      console.error('[tasks:deleteOlderThan]', err);
      throw err instanceof Error ? err : new Error('Failed to delete old tasks');
    }
  });
}
