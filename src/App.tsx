import { useState, useMemo, useEffect } from 'react';
import { useTasks, useSearchTasks } from './hooks';
import { BoardColumn } from './components/BoardColumn';
import { TaskDialog } from './components/TaskDialog';
import { LinkTaskDialog } from './components/LinkTaskDialog';
import { AboutDialog } from './components/AboutDialog';
import { Search, Plus, Info, Sun, Moon } from 'lucide-react';
import type { Task } from './types';

type FilterType = 'all' | 'pending' | 'done';

export default function App() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [linkingTask, setLinkingTask] = useState<Task | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const { data: allTasks, isLoading } = useTasks();
  const { data: searchResults } = useSearchTasks(searchQuery);

  const tasks = searchQuery ? searchResults || [] : allTasks || [];

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.board === 'today').sort((a, b) => a.position - b.position),
    [tasks]
  );

  const backlogTasks = useMemo(
    () => tasks.filter((t) => t.board === 'backlog').sort((a, b) => a.position - b.position),
    [tasks]
  );

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleLinkTask = (task: Task) => {
    setLinkingTask(task);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground">Fast & Focus</h1>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Get today tasks done - Focus - No excuses
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="h-8 w-48 rounded-md border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="h-8 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>

            {/* Add Task */}
            <button
              onClick={handleAddTask}
              className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-secondary"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* About */}
            <button
              onClick={() => setAboutOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-secondary"
              title="About"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Two-board layout */}
      <main className="flex flex-1 overflow-hidden">
        <BoardColumn
          title="Today"
          tasks={todayTasks}
          filter={filter}
          onEdit={handleEdit}
          onLinkTask={handleLinkTask}
        />
        <div className="w-px bg-border" />
        <BoardColumn
          title="Backlog"
          tasks={backlogTasks}
          filter={filter}
          onEdit={handleEdit}
          onLinkTask={handleLinkTask}
        />
      </main>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={handleCloseTaskDialog}
        task={editingTask}
      />
      <LinkTaskDialog
        open={!!linkingTask}
        onClose={() => setLinkingTask(null)}
        sourceTask={linkingTask}
      />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
