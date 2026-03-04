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
      deleteOldTasks: (days: number) => Promise<{ deleted: number }>;
      getTaskLinks: (taskId: string) => Promise<TaskLink[]>;
      createTaskLink: (link: CreateTaskLinkInput) => Promise<TaskLink>;
      deleteTaskLink: (id: string) => Promise<{ success: boolean }>;
      getAppInfo: () => Promise<AppInfo>;
      openExternal: (url: string) => Promise<void>;
      exportData: () => Promise<{ success: boolean }>;
      importData: () => Promise<{ success: boolean; taskCount?: number }>;
    };
  }
}

const eAPI = () => {
  if (!window.electronAPI) throw new Error('Electron API not available — is the preload loaded?');
  return window.electronAPI;
};

const api = {
  tasks: {
    getAll: (board?: string) => eAPI().getTasks(board),
    get: (id: string) => eAPI().getTask(id),
    create: (task: CreateTaskInput) => eAPI().createTask(task),
    update: (id: string, updates: UpdateTaskInput) => eAPI().updateTask(id, updates),
    delete: (id: string) => eAPI().deleteTask(id),
    toggle: (id: string) => eAPI().toggleTask(id),
    move: (id: string, board: string) => eAPI().moveTask(id, board),
    reorder: (id: string, newPosition: number) => eAPI().reorderTask(id, newPosition),
    search: (query: string) => eAPI().searchTasks(query),
    deleteOlderThan: (days: number) => eAPI().deleteOldTasks(days),
  },
  taskLinks: {
    get: (taskId: string) => eAPI().getTaskLinks(taskId),
    create: (link: CreateTaskLinkInput) => eAPI().createTaskLink(link),
    delete: (id: string) => eAPI().deleteTaskLink(id),
  },
  app: {
    getInfo: () => eAPI().getAppInfo(),
    openExternal: (url: string) => eAPI().openExternal(url),
  },
  data: {
    export: () => eAPI().exportData(),
    import: () => eAPI().importData(),
  },
};

export default api;
