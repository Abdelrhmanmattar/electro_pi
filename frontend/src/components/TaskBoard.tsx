/**
 * TaskBoard — Kanban layout: three columns by status.
 * On mobile the columns stack vertically (grid-cols-1); on md+ they sit side by
 * side (grid-cols-3), satisfying the responsive requirement.
 */
import { TaskCard } from './TaskCard';
import { TASK_STATUSES, STATUS_LABELS } from '../types';
import type { Task, TaskStatus } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: 'border-t-slate-400',
  in_progress: 'border-t-blue-400',
  done: 'border-t-green-400',
};

export function TaskBoard({ tasks, onEdit, onDelete }: TaskBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            className={`rounded-xl border-t-4 bg-slate-100/60 p-3 ${COLUMN_ACCENT[status]}`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-700">{STATUS_LABELS[status]}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {columnTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                  No tasks
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
