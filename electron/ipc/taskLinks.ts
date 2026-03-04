import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { assertUuid, assertLinkType } from './validate';

export function registerTaskLinkHandlers() {
  const db = getDb();

  ipcMain.handle('taskLinks:get', (_event, taskId: string) => {
    try {
      assertUuid(taskId, 'taskId');
      return db
        .prepare(
          `SELECT tl.*,
                  st.title as source_title,
                  tt.title as target_title
           FROM task_links tl
           JOIN tasks st ON st.id = tl.source_task_id
           JOIN tasks tt ON tt.id = tl.target_task_id
           WHERE tl.source_task_id = ? OR tl.target_task_id = ?`
        )
        .all(taskId, taskId);
    } catch (err) {
      console.error('[taskLinks:get]', err);
      throw new Error('Failed to fetch task links');
    }
  });

  ipcMain.handle(
    'taskLinks:create',
    (
      _event,
      link: { sourceTaskId: string; targetTaskId: string; type: string }
    ) => {
      try {
        assertUuid(link.sourceTaskId, 'sourceTaskId');
        assertUuid(link.targetTaskId, 'targetTaskId');
        assertLinkType(link.type);

        if (link.sourceTaskId === link.targetTaskId) {
          throw new Error('A task cannot link to itself');
        }

        const sourceExists = db.prepare('SELECT 1 FROM tasks WHERE id = ?').get(link.sourceTaskId);
        const targetExists = db.prepare('SELECT 1 FROM tasks WHERE id = ?').get(link.targetTaskId);
        if (!sourceExists || !targetExists) {
          throw new Error('One or both tasks do not exist');
        }

        const id = uuidv4();
        db.prepare(
          `INSERT INTO task_links (id, source_task_id, target_task_id, type) VALUES (?, ?, ?, ?)`
        ).run(id, link.sourceTaskId, link.targetTaskId, link.type);

        return db.prepare('SELECT * FROM task_links WHERE id = ?').get(id);
      } catch (err) {
        console.error('[taskLinks:create]', err);
        throw err instanceof Error ? err : new Error('Failed to create task link');
      }
    }
  );

  ipcMain.handle('taskLinks:delete', (_event, id: string) => {
    try {
      assertUuid(id);
      db.prepare('DELETE FROM task_links WHERE id = ?').run(id);
      return { success: true };
    } catch (err) {
      console.error('[taskLinks:delete]', err);
      throw new Error('Failed to delete task link');
    }
  });
}
