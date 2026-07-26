/**
 * MongoDB connection management (infrastructure layer).
 *
 * Isolates all Mongoose connection concerns so the rest of the app just calls
 * connectDatabase() at startup. Registers listeners for observability.
 */
import mongoose from 'mongoose';
import { env } from '../../config/env';

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
