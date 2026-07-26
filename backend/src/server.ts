/**
 * Server entry point.
 *
 * Connects to MongoDB, starts the HTTP server, and handles graceful shutdown.
 */
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/connection';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 API listening on http://localhost:${env.PORT}`);
    console.log(`   Health: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown on Ctrl+C / container stop.
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
