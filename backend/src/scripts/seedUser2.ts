/**
 * Seed ONLY the second demo user (Sara) + her tasks.
 *
 * Useful for demonstrating data isolation without touching user 1's data.
 *
 * Run with:  npm run seed:user2
 *
 * Demo login:  sara@taskapp.com  /  Sara1234
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { seedUser, USER_TWO } from './seedData';

async function seed(): Promise<void> {
  console.log('🌱 Seeding user 2 only...');
  await mongoose.connect(env.MONGODB_URI);

  await seedUser(USER_TWO);

  await mongoose.disconnect();
  console.log('✅ Seed complete');
  console.log(`\n   Demo login →  ${USER_TWO.email}  /  ${USER_TWO.password}\n`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
