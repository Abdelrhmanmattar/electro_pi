/**
 * Database seed script — creates a demo account + sample tasks.
 *
 * Reuses the real repositories and password hasher so seeded data is identical
 * to what the running app would create. Safe to re-run: it clears existing
 * demo data first.
 *
 * Run with:  npm run seed
 *
 * Demo login:  demo@taskapp.com  /  Demo1234
 */
import mongoose, { Types } from 'mongoose';
import { env } from '../config/env';
import { UserModel } from '../infrastructure/models/UserModel';
import { TaskModel } from '../infrastructure/models/TaskModel';
import { MongoUserRepository } from '../infrastructure/repositories/MongoUserRepository';
import { MongoTaskRepository } from '../infrastructure/repositories/MongoTaskRepository';
import { BcryptPasswordHasher } from '../infrastructure/security/BcryptPasswordHasher';
import type { TaskStatus, TaskPriority } from '../domain/entities/Task';

const DEMO_EMAIL = 'demo@taskapp.com';
const DEMO_PASSWORD = 'Demo1234';

interface SeedTask {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueInDays: number | null;
}

const SEED_TASKS: SeedTask[] = [
  { title: 'Set up project repository', description: 'Init git, add README and .gitignore', status: 'done', priority: 'high', dueInDays: -2 },
  { title: 'Design database schema', description: 'User and Task models with indexes', status: 'done', priority: 'medium', dueInDays: -1 },
  { title: 'Build authentication', description: 'JWT login/register with bcrypt', status: 'in_progress', priority: 'high', dueInDays: 1 },
  { title: 'Implement task CRUD API', description: 'Create, read, update, delete endpoints', status: 'in_progress', priority: 'medium', dueInDays: 2 },
  { title: 'Add search and filters', description: 'Search by title, filter by status/priority', status: 'todo', priority: 'medium', dueInDays: 3 },
  { title: 'Write frontend UI', description: 'React + Tailwind responsive board', status: 'todo', priority: 'high', dueInDays: 5 },
  { title: 'Buy groceries', description: 'Milk, eggs, coffee', status: 'todo', priority: 'low', dueInDays: null },
];

async function seed(): Promise<void> {
  console.log('🌱 Seeding database...');
  await mongoose.connect(env.MONGODB_URI);

  const users = new MongoUserRepository();
  const tasks = new MongoTaskRepository();
  const hasher = new BcryptPasswordHasher();

  // Clear any previous demo user + their tasks (idempotent re-runs).
  const existing = await UserModel.findOne({ email: DEMO_EMAIL }).lean<{
    _id: Types.ObjectId;
  } | null>();
  if (existing) {
    await TaskModel.deleteMany({ userId: existing._id });
    await UserModel.deleteOne({ _id: existing._id });
    console.log('   • cleared previous demo data');
  }

  const passwordHash = await hasher.hash(DEMO_PASSWORD);
  const user = await users.create({ name: 'Demo User', email: DEMO_EMAIL, passwordHash });
  console.log(`   • created demo user (${DEMO_EMAIL})`);

  // A fixed base date keeps seeding deterministic regardless of run time.
  const base = new Date('2026-07-26T12:00:00.000Z');
  for (const t of SEED_TASKS) {
    const dueDate =
      t.dueInDays === null ? null : new Date(base.getTime() + t.dueInDays * 86_400_000);
    await tasks.create({
      userId: user.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate,
    });
  }
  console.log(`   • created ${SEED_TASKS.length} sample tasks`);

  await mongoose.disconnect();
  console.log('✅ Seed complete');
  console.log(`\n   Demo login →  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}\n`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
