import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';

export function registerTaskLinkHandlers() {
  const db = getDb();

  ipcMain.handle('taskLinks:get', (_event, taskId: string) => {
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
  });

  ipcMain.handle(
    'taskLinks:create',
    (
      _event,
      link: { sourceTaskId: string; targetTaskId: string; type: string }
    ) => {
      const id = uuidv4();
      db.prepare(
        `INSERT INTO task_links (id, source_task_id, target_task_id, type) VALUES (?, ?, ?, ?)`
      ).run(id, link.sourceTaskId, link.targetTaskId, link.type);

      return db.prepare('SELECT * FROM task_links WHERE id = ?').get(id);
    }
  );

  ipcMain.handle('taskLinks:delete', (_event, id: string) => {
    db.prepare('DELETE FROM task_links WHERE id = ?').run(id);
    return { success: true };
  });
}
