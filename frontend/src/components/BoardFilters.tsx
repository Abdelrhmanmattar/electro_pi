/**
 * BoardFilters — search box + priority dropdown for the Kanban board.
 *
 * There's no status dropdown here: on the board each column IS a status, so a
 * board-wide status filter would just empty the other columns. Search and
 * priority apply within every column.
 *
 * The search input is debounced locally so we don't refetch on every keystroke.
 */
import { useEffect, useState } from 'react';
import { Select } from './ui/Select';
import { TASK_PRIORITIES, PRIORITY_LABELS } from '../types';
import type { TaskPriority } from '../types';
import type { BoardFilters as Filters } from '../hooks/useBoard';

interface BoardFiltersProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}

const priorityOptions = TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));

export function BoardFilters({ filters, onChange }: BoardFiltersProps) {
  const [searchText, setSearchText] = useState(filters.search ?? '');

  // Debounce the search input (300ms) before propagating to the query.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((filters.search ?? '') !== searchText) {
        onChange({ search: searchText });
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="search" className="mb-1 block text-sm font-medium text-slate-700">
          Search
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id="search"
            type="text"
            placeholder="Search by title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="w-full sm:w-40">
        <Select
          label="Priority"
          placeholder="All priorities"
          options={priorityOptions}
          value={filters.priority ?? ''}
          onChange={(e) => onChange({ priority: e.target.value as TaskPriority | '' })}
        />
      </div>
    </div>
  );
}
