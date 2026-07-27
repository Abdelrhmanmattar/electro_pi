/**
 * Shared seed data + seeding helper.
 *
 * Defines the demo user profiles and a reusable seedUser() function so the
 * individual seed scripts don't duplicate the create/clear logic. Reuses the
 * real repositories + hasher, so seeded data is identical to app-created data.
 */
import { Types } from 'mongoose';
import { UserModel } from '../infrastructure/models/UserModel';
import { TaskModel } from '../infrastructure/models/TaskModel';
import { MongoUserRepository } from '../infrastructure/repositories/MongoUserRepository';
import { MongoTaskRepository } from '../infrastructure/repositories/MongoTaskRepository';
import { BcryptPasswordHasher } from '../infrastructure/security/BcryptPasswordHasher';
import type { TaskStatus, TaskPriority } from '../domain/entities/Task';

export interface SeedTask {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueInDays: number | null;
}

export interface SeedProfile {
  name: string;
  email: string;
  password: string;
  tasks: SeedTask[];
}

/** A fixed base date keeps seeding deterministic regardless of run time. */
const BASE_DATE = new Date('2026-07-26T12:00:00.000Z');

/** User 1 — the primary demo account (project-themed tasks). */
export const USER_ONE: SeedProfile = {
  name: 'Demo User',
  email: 'demo@taskapp.com',
  password: 'Demo1234',
  tasks: [
    { title: 'Set up project repository', description: 'Init git, add README and .gitignore', status: 'done', priority: 'high', dueInDays: -2 },
    { title: 'Design database schema', description: 'User and Task models with indexes', status: 'done', priority: 'medium', dueInDays: -1 },
    { title: 'Build authentication', description: 'JWT login/register with bcrypt', status: 'in_progress', priority: 'high', dueInDays: 1 },
    { title: 'Implement task CRUD API', description: 'Create, read, update, delete endpoints', status: 'in_progress', priority: 'medium', dueInDays: 2 },
    { title: 'Add search and filters', description: 'Search by title, filter by status/priority', status: 'todo', priority: 'medium', dueInDays: 3 },
    { title: 'Write frontend UI', description: 'React + Tailwind responsive board', status: 'todo', priority: 'high', dueInDays: 5 },
    { title: 'Buy groceries', description: 'Milk, eggs, coffee', status: 'todo', priority: 'low', dueInDays: null },
  ],
};

/**
 * User 2 — a SECOND account with completely different tasks.
 * Its purpose is to demonstrate data isolation: logged in as user 2 you must
 * NOT see any of user 1's tasks (requirement #3, "own tasks only").
 */
export const USER_TWO: SeedProfile = {
  name: 'Sara Ahmed',
  email: 'sara@taskapp.com',
  password: 'Sara1234',
  tasks: [
    { title: 'Prepare marketing deck', description: 'Slides for the Q3 campaign review', status: 'in_progress', priority: 'high', dueInDays: 1 },
    { title: 'Email the design team', description: 'Send feedback on the new logo drafts', status: 'todo', priority: 'medium', dueInDays: 2 },
    { title: 'Book flight to Riyadh', description: 'Conference trip next month', status: 'todo', priority: 'low', dueInDays: 10 },
    { title: 'Review Q2 budget', description: 'Reconcile spend against forecast', status: 'done', priority: 'high', dueInDays: -3 },
    { title: 'Renew domain name', description: 'taskapp.com expires soon', status: 'todo', priority: 'high', dueInDays: 4 },
  ],
};

/**
 * Seed a single user + their tasks. Idempotent: clears any existing account
 * with the same email (and its tasks) first, so re-running is safe.
 */
export async function seedUser(profile: SeedProfile): Promise<void> {
  const users = new MongoUserRepository();
  const tasks = new MongoTaskRepository();
  const hasher = new BcryptPasswordHasher();

  const existing = await UserModel.findOne({ email: profile.email }).lean<{
    _id: Types.ObjectId;
  } | null>();
  if (existing) {
    await TaskModel.deleteMany({ userId: existing._id });
    await UserModel.deleteOne({ _id: existing._id });
    console.log(`   • cleared previous data for ${profile.email}`);
  }

  const passwordHash = await hasher.hash(profile.password);
  const user = await users.create({
    name: profile.name,
    email: profile.email,
    passwordHash,
  });
  console.log(`   • created user ${profile.email}`);

  for (const t of profile.tasks) {
    const dueDate =
      t.dueInDays === null ? null : new Date(BASE_DATE.getTime() + t.dueInDays * 86_400_000);
    await tasks.create({
      userId: user.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate,
    });
  }
  console.log(`   • created ${profile.tasks.length} tasks for ${profile.email}`);
}

/**
 * Ten "To Do" tasks for the Demo User. All share status 'todo' with a spread of
 * priorities and due dates, useful for demonstrating a full To Do column,
 * search, and pagination.
 */
export const DEMO_TODO_TASKS: SeedTask[] = [
  { title: 'Write project README', description: 'Setup, env vars, API endpoints, known issues', status: 'todo', priority: 'high', dueInDays: 1 },
  { title: 'Add form validation messages', description: 'Inline errors on login and task forms', status: 'todo', priority: 'medium', dueInDays: 2 },
  { title: 'Set up ESLint + Prettier', description: 'Consistent formatting across the codebase', status: 'todo', priority: 'low', dueInDays: 3 },
  { title: 'Write API integration tests', description: 'Cover auth and task CRUD endpoints', status: 'todo', priority: 'high', dueInDays: 4 },
  { title: 'Improve mobile layout', description: 'Test the board on small screens', status: 'todo', priority: 'medium', dueInDays: 5 },
  { title: 'Add empty-state illustrations', description: 'Friendlier empty columns', status: 'todo', priority: 'low', dueInDays: 6 },
  { title: 'Configure CI pipeline', description: 'Run typecheck + tests on push', status: 'todo', priority: 'medium', dueInDays: 7 },
  { title: 'Add password strength meter', description: 'Guide users on the register form', status: 'todo', priority: 'low', dueInDays: 8 },
  { title: 'Prepare deployment', description: 'Dockerize and deploy a live demo', status: 'todo', priority: 'high', dueInDays: 10 },
  { title: 'Record a demo walkthrough', description: 'Short video of the main features', status: 'todo', priority: 'medium', dueInDays: 12 },
];

/**
 * APPEND tasks to an existing user WITHOUT clearing their current tasks.
 * (seedUser replaces; this one adds.) Creates the user first if missing.
 */
export async function addTasksForUser(
  profile: Pick<SeedProfile, 'name' | 'email' | 'password'>,
  newTasks: SeedTask[]
): Promise<number> {
  const users = new MongoUserRepository();
  const tasks = new MongoTaskRepository();
  const hasher = new BcryptPasswordHasher();

  const existing = await UserModel.findOne({ email: profile.email }).lean<{
    _id: Types.ObjectId;
  } | null>();

  let userId: string;
  if (existing) {
    userId = String(existing._id);
    console.log(`   • found existing user ${profile.email}`);
  } else {
    const passwordHash = await hasher.hash(profile.password);
    const created = await users.create({
      name: profile.name,
      email: profile.email,
      passwordHash,
    });
    userId = created.id;
    console.log(`   • created user ${profile.email}`);
  }

  for (const t of newTasks) {
    const dueDate =
      t.dueInDays === null ? null : new Date(BASE_DATE.getTime() + t.dueInDays * 86_400_000);
    await tasks.create({
      userId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate,
    });
  }
  console.log(`   • added ${newTasks.length} tasks to ${profile.email}`);
  return newTasks.length;
}
