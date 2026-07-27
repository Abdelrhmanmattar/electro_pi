/**
 * useBoard — Kanban board state with INDEPENDENT pagination per status column.
 *
 * Each column (todo / in_progress / done) has its own page. On every render we
 * fetch all three columns in parallel via the existing GET /tasks endpoint
 * (?status=X&page=N&limit=10), so the backend needs no changes. The shared
 * search/priority filters apply within every column.
 *
 * Create/update/delete/move refetch the board to stay in sync.
 */
import { useCallback, useEffect, useState } from 'react';
import { taskService } from '../lib/taskService';
import { getErrorMessage } from '../lib/api';
import { TASK_STATUSES } from '../types';
import type { Task, TaskStatus, TaskInput, TaskFilters } from '../types';

export const PAGE_SIZE = 10;

/** One column's paginated state. */
export interface ColumnState {
  items: Task[];
  page: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

type Columns = Record<TaskStatus, ColumnState>;
type Pages = Record<TaskStatus, number>;

const emptyColumn = (page: number): ColumnState => ({
  items: [],
  page,
  total: 0,
  totalPages: 1,
  hasPrev: page > 1,
  hasNext: false,
});

/** Filters that apply to every column (search + priority; status is per-column). */
export interface BoardFilters {
  search?: string;
  priority?: TaskFilters['priority'];
}

export function useBoard(filters: BoardFilters) {
  const [pages, setPages] = useState<Pages>({ todo: 1, in_progress: 1, done: 1 });
  const [columns, setColumns] = useState<Columns>({
    todo: emptyColumn(1),
    in_progress: emptyColumn(1),
    done: emptyColumn(1),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { search, priority } = filters;

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all three columns in parallel.
      const results = await Promise.all(
        TASK_STATUSES.map((status) =>
          taskService
            .list({ status, search, priority, page: pages[status], limit: PAGE_SIZE })
            .then((res) => ({ status, res }))
        )
      );

      const next = {} as Columns;
      for (const { status, res } of results) {
        const { total, page, totalPages } = res.pagination;
        next[status] = {
          items: res.tasks,
          page,
          total,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        };
      }
      setColumns(next);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, priority, pages]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  // Reset all columns to page 1 whenever the shared filters change.
  useEffect(() => {
    setPages({ todo: 1, in_progress: 1, done: 1 });
  }, [search, priority]);

  const setColumnPage = useCallback((status: TaskStatus, page: number) => {
    setPages((p) => ({ ...p, [status]: Math.max(1, page) }));
  }, []);

  // --- Mutations: refetch the board afterwards ---
  const saveTask = useCallback(
    async (input: TaskInput, opts: { id?: string; coverFile?: File; removeCover?: boolean } = {}) => {
      if (opts.id) {
        await taskService.update(opts.id, input);
        if (opts.coverFile) await taskService.uploadCover(opts.id, opts.coverFile);
        else if (opts.removeCover) await taskService.removeCover(opts.id);
      } else {
        await taskService.create(input, opts.coverFile);
      }
      await fetchBoard();
    },
    [fetchBoard]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.remove(id);
      await fetchBoard();
    },
    [fetchBoard]
  );

  const moveTask = useCallback(
    async (id: string, newStatus: TaskStatus) => {
      // Find the task in whichever column currently holds it.
      const current = Object.values(columns)
        .flatMap((c) => c.items)
        .find((t) => t.id === id);
      if (!current || current.status === newStatus) return;
      await taskService.update(id, { status: newStatus });
      await fetchBoard();
    },
    [columns, fetchBoard]
  );

  const totalTasks = columns.todo.total + columns.in_progress.total + columns.done.total;

  return {
    columns,
    loading,
    error,
    totalTasks,
    refetch: fetchBoard,
    setColumnPage,
    saveTask,
    deleteTask,
    moveTask,
  };
}
