/**
 * Database seed script — creates TWO demo accounts, each with their own tasks.
 *
 * Two users are seeded so you can demonstrate data isolation in the review:
 * logging in as one user must never reveal the other's tasks (requirement #3).
 *
 * Run with:  npm run seed          (seeds both users)
 *            npm run seed:user2    (seeds only user 2)
 *
 * Demo logins:
 *   User 1 →  demo@taskapp.com  /  Demo1234
 *   User 2 →  sara@taskapp.com  /  Sara1234
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { seedUser, USER_ONE, USER_TWO } from './seedData';

async function seed(): Promise<void> {
  console.log('🌱 Seeding database (2 users)...');
  await mongoose.connect(env.MONGODB_URI);

  await seedUser(USER_ONE);
  await seedUser(USER_TWO);

  await mongoose.disconnect();
  console.log('✅ Seed complete');
  console.log('\n   Demo logins:');
  console.log(`     User 1 →  ${USER_ONE.email}  /  ${USER_ONE.password}`);
  console.log(`     User 2 →  ${USER_TWO.email}  /  ${USER_TWO.password}\n`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
