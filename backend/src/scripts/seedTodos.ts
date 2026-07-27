/**
 * Seed 10 "To Do" tasks for the Demo User — APPENDED to their existing tasks.
 *
 * Unlike `npm run seed` (which replaces a user's tasks), this only adds. Note:
 * because it appends, re-running it will keep adding another 10 each time.
 *
 * Run with:  npm run seed:todos
 *
 * Demo login:  demo@taskapp.com  /  Demo1234
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { addTasksForUser, DEMO_TODO_TASKS, USER_ONE } from './seedData';

async function seed(): Promise<void> {
  console.log('🌱 Adding 10 To Do tasks for the Demo User...');
  await mongoose.connect(env.MONGODB_URI);

  const added = await addTasksForUser(
    { name: USER_ONE.name, email: USER_ONE.email, password: USER_ONE.password },
    DEMO_TODO_TASKS
  );

  await mongoose.disconnect();
  console.log(`✅ Added ${added} To Do tasks`);
  console.log(`\n   Demo login →  ${USER_ONE.email}  /  ${USER_ONE.password}\n`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
