import type {
  Task,
  TaskLink,
  CreateTaskInput,
  UpdateTaskInput,
  CreateTaskLinkInput,
  AppInfo,
} from './types';

// Type declaration for the preload API
declare global {
  interface Window {
    electronAPI: {
      getTasks: (board?: string) => Promise<Task[]>;
      getTask: (id: string) => Promise<Task>;
      createTask: (task: CreateTaskInput) => Promise<Task>;
      updateTask: (id: string, updates: UpdateTaskInput) => Promise<Task>;
      deleteTask: (id: string) => Promise<{ success: boolean }>;
      toggleTask: (id: string) => Promise<Task>;
      moveTask: (id: string, board: string) => Promise<Task>;
      reorderTask: (id: string, newPosition: number) => Promise<Task>;
      searchTasks: (query: string) => Promise<Task[]>;
      getTaskLinks: (taskId: string) => Promise<TaskLink[]>;
      createTaskLink: (link: CreateTaskLinkInput) => Promise<TaskLink>;
      deleteTaskLink: (id: string) => Promise<{ success: boolean }>;
      getAppInfo: () => Promise<AppInfo>;
    };
  }
}

const api = {
  tasks: {
    getAll: (board?: string) => window.electronAPI.getTasks(board),
    get: (id: string) => window.electronAPI.getTask(id),
    create: (task: CreateTaskInput) => window.electronAPI.createTask(task),
    update: (id: string, updates: UpdateTaskInput) => window.electronAPI.updateTask(id, updates),
    delete: (id: string) => window.electronAPI.deleteTask(id),
    toggle: (id: string) => window.electronAPI.toggleTask(id),
    move: (id: string, board: string) => window.electronAPI.moveTask(id, board),
    reorder: (id: string, newPosition: number) => window.electronAPI.reorderTask(id, newPosition),
    search: (query: string) => window.electronAPI.searchTasks(query),
  },
  taskLinks: {
    get: (taskId: string) => window.electronAPI.getTaskLinks(taskId),
    create: (link: CreateTaskLinkInput) => window.electronAPI.createTaskLink(link),
    delete: (id: string) => window.electronAPI.deleteTaskLink(id),
  },
  app: {
    getInfo: () => window.electronAPI.getAppInfo(),
  },
};

export default api;
