/**
 * Database migration script.
 *
 * MongoDB is schema-less, so this is NOT a SQL-style migration. Instead it:
 *   1. connects to the database,
 *   2. ensures the collections exist,
 *   3. builds every index declared on the Mongoose models (via syncIndexes),
 *   4. reports the resulting structure.
 *
 * The single source of truth is the Mongoose models (UserModel, TaskModel) —
 * this script simply APPLIES them to the database on demand, so you get a
 * runnable "migration command" without duplicating the schema.
 *
 * Run with:  npm run migrate
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { UserModel } from '../infrastructure/models/UserModel';
import { TaskModel } from '../infrastructure/models/TaskModel';

async function migrate(): Promise<void> {
  console.log('🔧 Running migration...');
  console.log(`   Target: ${env.MONGODB_URI}`);

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  const models = [
    { name: 'users', model: UserModel },
    { name: 'tasks', model: TaskModel },
  ];

  for (const { name, model } of models) {
    // createCollection is idempotent-ish: ignore "already exists" (code 48).
    try {
      await model.createCollection();
      console.log(`   • collection "${name}" ensured`);
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code === 48) {
        console.log(`   • collection "${name}" already exists`);
      } else {
        throw err;
      }
    }

    // syncIndexes builds any missing indexes AND drops indexes no longer
    // declared on the model — keeping the DB exactly in sync with the code.
    await model.syncIndexes();
    const indexes = await model.collection.indexes();
    console.log(`   • "${name}" indexes: ${indexes.map((i) => i.name).join(', ')}`);
  }

  await mongoose.disconnect();
  console.log('✅ Migration complete');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
