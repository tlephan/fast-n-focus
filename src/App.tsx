import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTasks, useSearchTasks, useReorderTask, useUpdateTask } from './hooks';
import { BoardColumn } from './components/BoardColumn';
import { TaskDialog } from './components/TaskDialog';
import { LinkTaskDialog } from './components/LinkTaskDialog';
import { AboutDialog } from './components/AboutDialog';
import { Search, Plus, Info, Sun, Moon, GripVertical } from 'lucide-react';
import type { Task } from './types';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

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
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const isDraggingDivider = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  const reorderTask = useReorderTask();
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDivider.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingDivider.current || !mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const ratio = (ev.clientX - rect.left) / rect.width;
      setSplitRatio(Math.min(0.8, Math.max(0.2, ratio)));
    };

    const onMouseUp = () => {
      isDraggingDivider.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

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

  const pendingTodayTasks = useMemo(() => todayTasks.filter((t) => !t.done), [todayTasks]);
  const pendingBacklogTasks = useMemo(() => backlogTasks.filter((t) => !t.done), [backlogTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const draggedTask = active.data.current?.task as Task | undefined;
    if (!draggedTask) return;

    // Determine target board
    let targetBoardId: 'today' | 'backlog';
    let overTaskId: string | null = null;

    if (over.data.current?.boardId) {
      // Dropped on board droppable zone
      targetBoardId = over.data.current.boardId as 'today' | 'backlog';
    } else if (over.data.current?.task) {
      // Dropped on a specific task
      targetBoardId = (over.data.current.task as Task).board;
      overTaskId = over.id as string;
    } else {
      return;
    }

    const targetPendingTasks = targetBoardId === 'today' ? pendingTodayTasks : pendingBacklogTasks;

    if (draggedTask.board === targetBoardId) {
      // Same board: reorder
      if (!overTaskId || active.id === over.id) return;

      const activeIndex = targetPendingTasks.findIndex((t) => t.id === active.id);
      const overIndex = targetPendingTasks.findIndex((t) => t.id === overTaskId);

      if (activeIndex === -1 || overIndex === -1) return;

      let newPosition: number;
      if (overIndex === 0) {
        newPosition = targetPendingTasks[0].position - 1;
      } else if (overIndex === targetPendingTasks.length - 1) {
        newPosition = targetPendingTasks[targetPendingTasks.length - 1].position + 1;
      } else {
        const before = targetPendingTasks[overIndex - 1].position;
        const after = targetPendingTasks[overIndex].position;
        newPosition = (before + after) / 2;
      }

      reorderTask.mutate({ id: active.id as string, position: newPosition });
    } else {
      // Cross-board move: update both board and position atomically
      let newPosition: number;

      if (targetPendingTasks.length === 0) {
        newPosition = 1;
      } else if (!overTaskId) {
        // Dropped on board zone: append at end
        newPosition = targetPendingTasks[targetPendingTasks.length - 1].position + 1;
      } else {
        // Dropped on a specific task: insert before it
        const overIndex = targetPendingTasks.findIndex((t) => t.id === overTaskId);
        if (overIndex === 0) {
          newPosition = targetPendingTasks[0].position - 1;
        } else {
          const before = targetPendingTasks[overIndex - 1].position;
          const after = targetPendingTasks[overIndex].position;
          newPosition = (before + after) / 2;
        }
      }

      updateTask.mutate({
        id: active.id as string,
        updates: { board: targetBoardId, position: newPosition },
      });
    }
  };

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
      <header className="border-b bg-muted/60 px-4 py-3">
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main ref={mainRef} className="flex flex-1 overflow-hidden">
          <div style={{ width: `${splitRatio * 100}%` }} className="flex overflow-hidden">
            <BoardColumn
              title="Today"
              boardId="today"
              tasks={todayTasks}
              filter={filter}
              onEdit={handleEdit}
              onLinkTask={handleLinkTask}
            />
          </div>
          <div
            className="w-1 bg-border hover:bg-primary/40 cursor-col-resize flex-shrink-0 transition-colors"
            onMouseDown={handleDividerMouseDown}
          />
          <div style={{ width: `${(1 - splitRatio) * 100}%` }} className="flex overflow-hidden">
            <BoardColumn
              title="Backlog"
              boardId="backlog"
              tasks={backlogTasks}
              filter={filter}
              onEdit={handleEdit}
              onLinkTask={handleLinkTask}
            />
          </div>
        </main>

        <DragOverlay>
          {activeTask && (
            <div className="flex items-center gap-2 rounded-lg border bg-card p-3 shadow-lg opacity-90 cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">{activeTask.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
