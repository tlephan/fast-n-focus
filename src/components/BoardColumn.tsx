import { useState } from 'react';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';
import { cn } from '../lib/utils';
import { ChevronRight } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useReorderTask } from '../hooks';

type FilterType = 'all' | 'pending' | 'done';

interface BoardColumnProps {
  title: string;
  tasks: Task[];
  filter: FilterType;
  onEdit: (task: Task) => void;
  onLinkTask: (task: Task) => void;
}

export function BoardColumn({ title, tasks, filter, onEdit, onLinkTask }: BoardColumnProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const reorderTask = useReorderTask();

  const pendingTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);

  const visibleTasks =
    filter === 'pending'
      ? pendingTasks
      : filter === 'done'
        ? completedTasks
        : pendingTasks;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = visibleTasks.findIndex((t) => t.id === active.id);
    const overIndex = visibleTasks.findIndex((t) => t.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    // Calculate new position
    let newPosition: number;
    if (overIndex === 0) {
      newPosition = visibleTasks[0].position - 1;
    } else if (overIndex === visibleTasks.length - 1) {
      newPosition = visibleTasks[visibleTasks.length - 1].position + 1;
    } else {
      const before = visibleTasks[overIndex - 1].position;
      const after = visibleTasks[overIndex].position;
      newPosition = (before + after) / 2;
    }

    reorderTask.mutate({ id: active.id as string, position: newPosition });
  };

  const totalCount = tasks.length;
  const doneCount = completedTasks.length;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b px-4 py-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onLinkTask={onLinkTask}
              />
            ))}
          </SortableContext>
        </DndContext>

        {visibleTasks.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks here
          </p>
        )}

        {/* Completed section (only in 'all' filter) */}
        {filter === 'all' && completedTasks.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronRight
                className={cn(
                  'h-3 w-3 transition-transform',
                  showCompleted && 'rotate-90'
                )}
              />
              Completed ({completedTasks.length})
            </button>
            {showCompleted && (
              <div className="mt-2 space-y-2">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onLinkTask={onLinkTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        {totalCount} task{totalCount !== 1 && 's'} · {doneCount} done
      </div>
    </div>
  );
}
