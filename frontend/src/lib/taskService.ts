/**
 * Task API calls.
 */
import { api } from './api';
import type { Task, TaskInput, TaskFilters, TaskListResponse, TaskResponse } from '../types';

export const taskService = {
  async list(filters: TaskFilters = {}): Promise<TaskListResponse> {
    // Only send params that are set (empty string / undefined are omitted).
    const params: Record<string, string | number> = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const { data } = await api.get<TaskListResponse>('/tasks', { params });
    return data;
  },

  async create(input: TaskInput): Promise<Task> {
    const { data } = await api.post<TaskResponse>('/tasks', input);
    return data.task;
  },

  async update(id: string, input: Partial<TaskInput>): Promise<Task> {
    const { data } = await api.patch<TaskResponse>(`/tasks/${id}`, input);
    return data.task;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  /** Upload a cover image for a task (multipart/form-data, field "image"). */
  async uploadCover(id: string, file: File): Promise<Task> {
    const form = new FormData();
    form.append('image', file);
    const { data } = await api.post<TaskResponse>(`/tasks/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.task;
  },

  /** Remove a task's cover image. */
  async removeCover(id: string): Promise<Task> {
    const { data } = await api.delete<TaskResponse>(`/tasks/${id}/cover`);
    return data.task;
  },
};
