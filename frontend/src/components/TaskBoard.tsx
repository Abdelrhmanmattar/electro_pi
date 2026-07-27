/**
 * TaskBoard — Kanban layout: three columns by status, each with INDEPENDENT
 * pagination (10 per column, prev/next arrows).
 *
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
import type { ColumnState } from '../hooks/useBoard';

interface TaskBoardProps {
  columns: Record<TaskStatus, ColumnState>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (id: string, newStatus: TaskStatus) => void;
  onPageChange: (status: TaskStatus, page: number) => void;
}

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: 'border-t-slate-400',
  in_progress: 'border-t-blue-400',
  done: 'border-t-green-400',
};

export function TaskBoard({ columns, onEdit, onDelete, onMove, onPageChange }: TaskBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
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
        const col = columns[status];
        const isDropTarget = dragOverStatus === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverStatus !== status) setDragOverStatus(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverStatus((s) => (s === status ? null : s));
              }
            }}
            onDrop={(e) => handleDrop(e, status)}
            className={`flex flex-col rounded-xl border-t-4 p-3 transition-colors ${COLUMN_ACCENT[status]} ${
              isDropTarget ? 'bg-brand-50 ring-2 ring-brand-300' : 'bg-slate-100/60'
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-700">{STATUS_LABELS[status]}</h2>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                  {col.total}
                </span>
                {/* Per-column pagination — shown next to the count when >1 page */}
                {col.totalPages > 1 && (
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onPageChange(status, col.page - 1)}
                      disabled={!col.hasPrev}
                      aria-label={`Previous ${STATUS_LABELS[status]} page`}
                      className="rounded p-0.5 text-slate-500 hover:bg-white hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L9.06 10l3.71 3.71a.75.75 0 11-1.06 1.06l-4.24-4.24a.75.75 0 010-1.06l4.24-4.24a.75.75 0 011.08-.001z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <span className="min-w-[2.2rem] text-center text-xs tabular-nums text-slate-500">
                      {col.page}/{col.totalPages}
                    </span>
                    <button
                      onClick={() => onPageChange(status, col.page + 1)}
                      disabled={!col.hasNext}
                      aria-label={`Next ${STATUS_LABELS[status]} page`}
                      className="rounded p-0.5 text-slate-500 hover:bg-white hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.24 4.24a.75.75 0 010 1.06l-4.24 4.24a.75.75 0 01-1.08.001z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-h-[3rem] flex-1 flex-col gap-2">
              {col.items.length === 0 ? (
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
                col.items.map((task) => (
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
