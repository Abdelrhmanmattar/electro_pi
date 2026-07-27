/**
 * DashboardPage — the main task board.
 *
 * Composes: Navbar + filters + Kanban board (per-column pagination) + create/
 * edit modal + delete confirm. Renders the correct state (loading / error /
 * empty / data) per requirement #11.
 */
import { useMemo, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { BoardFilters } from '../components/BoardFilters';
import { TaskBoard } from '../components/TaskBoard';
import { TaskForm, type TaskFormResult } from '../components/TaskForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/States';
import { useBoard, type BoardFilters as Filters } from '../hooks/useBoard';
import { getErrorMessage } from '../lib/api';
import type { Task } from '../types';

export function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({ search: '', priority: '' });
  const {
    columns,
    loading,
    error,
    totalTasks,
    refetch,
    setColumnPage,
    saveTask,
    deleteTask,
    moveTask,
  } = useBoard(filters);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const patchFilters = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditing(task);
    setFormOpen(true);
  };

  const handleSubmit = async (result: TaskFormResult) => {
    await saveTask(result.input, {
      id: editing?.id,
      coverFile: result.coverFile,
      removeCover: result.removeCover,
    });
    setFormOpen(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    setDeleteError('');
    try {
      await deleteTask(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  };

  const hasActiveFilters = useMemo(
    () => Boolean(filters.search || filters.priority),
    [filters]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Your tasks</h1>
            <p className="text-sm text-slate-500">Organize and track your work</p>
          </div>
          <Button onClick={openCreate}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            New task
          </Button>
        </div>

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <BoardFilters filters={filters} onChange={patchFilters} />
        </div>

        {/* State handling */}
        {loading ? (
          <LoadingState label="Loading tasks..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : totalTasks === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              title="No tasks match your filters"
              description="Try changing or clearing your search and filters."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilters({ search: '', priority: '' })}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No tasks yet"
              description="Create your first task to get started."
              action={<Button onClick={openCreate}>Create a task</Button>}
            />
          )
        ) : (
          <TaskBoard
            columns={columns}
            onEdit={openEdit}
            onDelete={setDeleting}
            onMove={moveTask}
            onPageChange={setColumnPage}
          />
        )}
      </main>

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit task' : 'New task'}
      >
        <TaskForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete task">
        <div className="space-y-4">
          {deleteError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</div>
          )}
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-medium text-slate-900">"{deleting?.title}"</span>? This cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={deletingBusy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deletingBusy}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
