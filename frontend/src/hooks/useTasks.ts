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
import type { Task, TaskFilters, TaskInput, Pagination } from '../types';

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

  const createTask = useCallback(
    async (input: TaskInput) => {
      await taskService.create(input);
      await fetchTasks();
    },
    [fetchTasks]
  );

  const updateTask = useCallback(
    async (id: string, input: Partial<TaskInput>) => {
      await taskService.update(id, input);
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

  return {
    tasks,
    pagination,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
