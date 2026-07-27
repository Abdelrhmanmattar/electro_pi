/**
 * useTasks — owns the task list state for the dashboard.
 *
 * Handles fetching with the current filters, plus create/update/delete that
 * refetch to stay in sync. Exposes loading + error so the UI can show the
 * right state. Debounces nothing itself — the caller controls when filters
 * change (the search box debounces before updating them).
 */
import { useCallback, useEffect, useState } from 'react';
import { taskService } from '../lib/taskService';
import { getErrorMessage } from '../lib/api';
import { STATUS_LABELS } from '../types';
import type { Task, TaskFilters, TaskInput, TaskStatus, Pagination } from '../types';

export function useTasks(filters: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { search, status, priority, page, limit } = filters;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await taskService.list({ search, status, priority, page, limit });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, page, limit]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  /**
   * Save a task (create or update) together with an optional cover change.
   * The cover endpoints need a task id, so on CREATE we create first, then
   * upload the cover to the new id. A single refetch runs at the end.
   */
  const saveTask = useCallback(
    async (
      input: TaskInput,
      opts: { id?: string; coverFile?: File; removeCover?: boolean } = {}
    ) => {
      if (opts.id) {
        // UPDATE: patch fields (JSON), then adjust the cover via its own
        // endpoint if the user changed it.
        await taskService.update(opts.id, input);
        if (opts.coverFile) {
          await taskService.uploadCover(opts.id, opts.coverFile);
        } else if (opts.removeCover) {
          await taskService.removeCover(opts.id);
        }
      } else {
        // CREATE: a single request carries fields + optional cover file.
        await taskService.create(input, opts.coverFile);
      }

      await fetchTasks();
    },
    [fetchTasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.remove(id);
      await fetchTasks();
    },
    [fetchTasks]
  );

  /**
   * Move a task to a new status (used by drag-and-drop).
   * Optimistic: update local state immediately so the card jumps columns
   * instantly, then persist. If the request fails, roll back to the snapshot.
   */
  const moveTask = useCallback(
    async (id: string, newStatus: TaskStatus) => {
      const snapshot = tasks;
      const target = tasks.find((t) => t.id === id);
      if (!target || target.status === newStatus) return; // no-op

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: newStatus, statusLabel: STATUS_LABELS[newStatus] } : t
        )
      );
      try {
        await taskService.update(id, { status: newStatus });
      } catch (err) {
        setTasks(snapshot); // roll back on failure
        setError(getErrorMessage(err));
      }
    },
    [tasks]
  );

  return {
    tasks,
    pagination,
    loading,
    error,
    refetch: fetchTasks,
    saveTask,
    deleteTask,
    moveTask,
  };
}
