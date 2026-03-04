import { contextBridge, ipcRenderer } from 'electron';

const VALID_BOARDS = ['today', 'backlog'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];
const VALID_LINK_TYPES = ['related', 'blocks', 'blocked_by'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: unknown, name = 'id') {
  if (typeof value !== 'string' || !UUID_RE.test(value))
    throw new Error(`Invalid ${name}`);
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Tasks
  getTasks: (board?: string) => {
    if (board !== undefined && !VALID_BOARDS.includes(board))
      throw new Error('Invalid board');
    return ipcRenderer.invoke('tasks:getAll', board);
  },

  getTask: (id: string) => {
    assertUuid(id);
    return ipcRenderer.invoke('tasks:get', id);
  },

  createTask: (task: { title: string; description?: string; board: string; priority: string }) => {
    if (!VALID_BOARDS.includes(task.board)) throw new Error('Invalid board');
    if (!VALID_PRIORITIES.includes(task.priority)) throw new Error('Invalid priority');
    return ipcRenderer.invoke('tasks:create', task);
  },

  updateTask: (id: string, updates: Record<string, unknown>) => {
    assertUuid(id);
    return ipcRenderer.invoke('tasks:update', id, updates);
  },

  deleteTask: (id: string) => {
    assertUuid(id);
    return ipcRenderer.invoke('tasks:delete', id);
  },

  toggleTask: (id: string) => {
    assertUuid(id);
    return ipcRenderer.invoke('tasks:toggle', id);
  },

  moveTask: (id: string, board: string) => {
    assertUuid(id);
    if (!VALID_BOARDS.includes(board)) throw new Error('Invalid board');
    return ipcRenderer.invoke('tasks:move', id, board);
  },

  reorderTask: (id: string, newPosition: number) => {
    assertUuid(id);
    return ipcRenderer.invoke('tasks:reorder', id, newPosition);
  },

  searchTasks: (query: string) => {
    if (typeof query !== 'string' || query.length === 0) throw new Error('Invalid query');
    return ipcRenderer.invoke('tasks:search', query);
  },

  deleteOldTasks: (days: number) => {
    if (!Number.isInteger(days) || days <= 0) throw new Error('Invalid days value');
    return ipcRenderer.invoke('tasks:deleteOlderThan', days);
  },

  // Task Links
  getTaskLinks: (taskId: string) => {
    assertUuid(taskId, 'taskId');
    return ipcRenderer.invoke('taskLinks:get', taskId);
  },

  createTaskLink: (link: { sourceTaskId: string; targetTaskId: string; type: string }) => {
    assertUuid(link.sourceTaskId, 'sourceTaskId');
    assertUuid(link.targetTaskId, 'targetTaskId');
    if (!VALID_LINK_TYPES.includes(link.type)) throw new Error('Invalid link type');
    return ipcRenderer.invoke('taskLinks:create', link);
  },

  deleteTaskLink: (id: string) => {
    assertUuid(id);
    return ipcRenderer.invoke('taskLinks:delete', id);
  },

  // App
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),

  // Data
  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
});
