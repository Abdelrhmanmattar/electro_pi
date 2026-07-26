/**
 * TaskCard — one task in a Kanban column.
 */
import { StatusBadge, PriorityBadge } from './ui/Badge';
import { assetUrl } from '../config/env';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** Fired when the user starts dragging this card (drag-and-drop). */
  onDragStart?: (task: Task) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

/** Format an ISO date as e.g. "Aug 1, 2026"; flag if overdue. */
function formatDue(iso: string | null): { text: string; overdue: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const text = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const overdue = d.getTime() < new Date().setHours(0, 0, 0, 0);
  return { text, overdue };
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: TaskCardProps) {
  const due = formatDue(task.dueDate);
  const cover = assetUrl(task.coverImage);

  return (
    <div
      draggable
      onDragStart={(e) => {
        // Store the task id so the drop target knows what was dropped.
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(task);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`group cursor-grab overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {cover && (
        <img
          src={cover}
          alt=""
          className="h-24 w-full object-cover"
          draggable={false}
          loading="lazy"
        />
      )}
      <div className="p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-900">{task.title}</h3>
        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
            aria-label="Edit task"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task)}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete task"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        {due && (
          <span
            className={`ml-auto text-xs ${due.overdue ? 'font-medium text-red-600' : 'text-slate-400'}`}
          >
            {due.overdue ? 'Overdue · ' : ''}
            {due.text}
          </span>
        )}
      </div>
      </div>
    </div>
  );
}
