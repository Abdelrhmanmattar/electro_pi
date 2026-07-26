/**
 * TaskBoard — Kanban layout: three columns by status.
 * On mobile the columns stack vertically (grid-cols-1); on md+ they sit side by
 * side (grid-cols-3), satisfying the responsive requirement.
 *
 * Drag-and-drop (bonus): each card is draggable and each column is a drop
 * target. Dropping a card onto a different column moves it to that status via
 * onMove. Uses the native HTML5 Drag and Drop API — no external dependency.
 */
import { useState, type DragEvent } from 'react';
import { TaskCard } from './TaskCard';
import { TASK_STATUSES, STATUS_LABELS } from '../types';
import type { Task, TaskStatus } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** Move a task to a new status (drag-and-drop between columns). */
  onMove: (id: string, newStatus: TaskStatus) => void;
}

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: 'border-t-slate-400',
  in_progress: 'border-t-blue-400',
  done: 'border-t-green-400',
};

export function TaskBoard({ tasks, onEdit, onDelete, onMove }: TaskBoardProps) {
  // The task currently being dragged (for the "lifted" visual on its card).
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // The column currently hovered while dragging (for the drop highlight).
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setDragOverStatus(null);
    setDraggingId(null);
    if (id) onMove(id, status);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const isDropTarget = dragOverStatus === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault(); // allow dropping
              e.dataTransfer.dropEffect = 'move';
              if (dragOverStatus !== status) setDragOverStatus(status);
            }}
            onDragLeave={(e) => {
              // Only clear when leaving the column itself, not moving between
              // its children (relatedTarget still inside → ignore).
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverStatus((s) => (s === status ? null : s));
              }
            }}
            onDrop={(e) => handleDrop(e, status)}
            className={`rounded-xl border-t-4 p-3 transition-colors ${COLUMN_ACCENT[status]} ${
              isDropTarget ? 'bg-brand-50 ring-2 ring-brand-300' : 'bg-slate-100/60'
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-700">{STATUS_LABELS[status]}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex min-h-[3rem] flex-col gap-2">
              {columnTasks.length === 0 ? (
                <p
                  className={`rounded-lg border border-dashed px-3 py-6 text-center text-xs transition-colors ${
                    isDropTarget
                      ? 'border-brand-300 text-brand-500'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  {isDropTarget ? 'Drop here' : 'No tasks'}
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDragStart={(t) => setDraggingId(t.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverStatus(null);
                    }}
                    isDragging={draggingId === task.id}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
