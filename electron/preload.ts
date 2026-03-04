import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Tasks
  getTasks: (board?: string) => ipcRenderer.invoke('tasks:getAll', board),
  getTask: (id: string) => ipcRenderer.invoke('tasks:get', id),
  createTask: (task: { title: string; description?: string; board: string; priority: string }) =>
    ipcRenderer.invoke('tasks:create', task),
  updateTask: (id: string, updates: Record<string, unknown>) =>
    ipcRenderer.invoke('tasks:update', id, updates),
  deleteTask: (id: string) => ipcRenderer.invoke('tasks:delete', id),
  toggleTask: (id: string) => ipcRenderer.invoke('tasks:toggle', id),
  moveTask: (id: string, board: string) => ipcRenderer.invoke('tasks:move', id, board),
  reorderTask: (id: string, newPosition: number) =>
    ipcRenderer.invoke('tasks:reorder', id, newPosition),
  searchTasks: (query: string) => ipcRenderer.invoke('tasks:search', query),

  // Task Links
  getTaskLinks: (taskId: string) => ipcRenderer.invoke('taskLinks:get', taskId),
  createTaskLink: (link: { sourceTaskId: string; targetTaskId: string; type: string }) =>
    ipcRenderer.invoke('taskLinks:create', link),
  deleteTaskLink: (id: string) => ipcRenderer.invoke('taskLinks:delete', id),

  // App
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
});
