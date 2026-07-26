/**
 * TaskForm — create or edit a task. Used inside the Modal.
 * Does client-side validation and surfaces server validation errors per field.
 */
import { useState, useRef, type FormEvent } from 'react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { getErrorMessage, getFieldErrors } from '../lib/api';
import { assetUrl } from '../config/env';
import { TASK_STATUSES, TASK_PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import type { Task, TaskInput, TaskStatus, TaskPriority } from '../types';

/** What the form hands back on submit: the fields plus optional cover changes. */
export interface TaskFormResult {
  input: TaskInput;
  /** A newly-picked cover file to upload (or undefined if unchanged). */
  coverFile?: File;
  /** True if the user cleared an existing cover. */
  removeCover?: boolean;
}

interface TaskFormProps {
  initial?: Task;
  onSubmit: (result: TaskFormResult) => Promise<void>;
  onCancel: () => void;
}

const MAX_COVER_BYTES = 2 * 1024 * 1024;
const ALLOWED_COVER = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const statusOptions = TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));
const priorityOptions = TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));

/** yyyy-mm-dd for the date input, from an ISO string. */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function TaskForm({ initial, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(toDateInput(initial?.dueDate));

  // Cover image state:
  //  - coverFile: a newly picked File (to upload)
  //  - preview: object URL for the picked file, OR the existing cover URL
  //  - removeExisting: user cleared the current cover
  const [coverFile, setCoverFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(assetUrl(initial?.coverImage));
  const [removeExisting, setRemoveExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePickCover = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_COVER.includes(file.type)) {
      setErrors((e) => ({ ...e, cover: 'Only jpg, png, webp or gif images are allowed' }));
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setErrors((e) => ({ ...e, cover: 'Image must be 2 MB or smaller' }));
      return;
    }
    setErrors((e) => {
      const { cover: _cover, ...rest } = e;
      return rest;
    });
    setCoverFile(file);
    setRemoveExisting(false);
    setPreview(URL.createObjectURL(file));
  };

  const clearCover = () => {
    setCoverFile(undefined);
    setPreview(null);
    setRemoveExisting(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Title is required';
    else if (title.trim().length > 120) next.title = 'Title is too long';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        input: {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        },
        coverFile,
        removeCover: removeExisting,
      });
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields) setErrors(fields);
      setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {formError}
        </div>
      )}

      <Input
        label="Title"
        name="title"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        autoFocus
      />

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Add more detail (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Status"
          name="status"
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
        />
        <Select
          label="Priority"
          name="priority"
          options={priorityOptions}
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
        />
      </div>

      <Input
        label="Due date"
        name="dueDate"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        error={errors.dueDate}
      />

      {/* Cover image picker with live preview */}
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Cover image</span>
        {preview ? (
          <div className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
            <img src={preview} alt="Cover preview" className="h-32 w-full object-cover" />
            <button
              type="button"
              onClick={clearCover}
              className="absolute right-2 top-2 rounded-md bg-slate-900/60 px-2 py-1 text-xs font-medium text-white hover:bg-slate-900/80"
            >
              Remove
            </button>
          </div>
        ) : (
          <label
            htmlFor="cover"
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500 hover:border-brand-400 hover:bg-slate-50"
          >
            <svg className="h-6 w-6 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <span>Click to upload an image</span>
            <span className="text-xs text-slate-400">jpg, png, webp, gif · max 2 MB</span>
          </label>
        )}
        <input
          ref={fileInputRef}
          id="cover"
          name="cover"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handlePickCover(e.target.files?.[0])}
        />
        {errors.cover && <p className="mt-1 text-xs text-red-600">{errors.cover}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
