/**
 * Composition root (presentation layer).
 *
 * The ONE place where concrete implementations are instantiated and injected
 * into the layers that depend on abstractions. Everything above this file
 * depends only on interfaces; here we choose Mongo + bcrypt + JWT + Express.
 */
import path from 'node:path';
import express, { type Express } from 'express';
import cors from 'cors';

import { env } from './config/env';

// Infrastructure (concrete)
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { MongoTaskRepository } from './infrastructure/repositories/MongoTaskRepository';
import { BcryptPasswordHasher } from './infrastructure/security/BcryptPasswordHasher';
import { JwtTokenService } from './infrastructure/security/JwtTokenService';
import {
  LocalFileStorage,
  UPLOAD_DIR,
  UPLOAD_ROUTE,
} from './infrastructure/storage/LocalFileStorage';
import { RedisTaskCache } from './infrastructure/cache/RedisTaskCache';

// Application (use cases)
import { RegisterUser } from './application/use-cases/auth/RegisterUser';
import { LoginUser } from './application/use-cases/auth/LoginUser';
import { GetCurrentUser } from './application/use-cases/auth/GetCurrentUser';
import { CreateTask } from './application/use-cases/tasks/CreateTask';
import { GetTasks } from './application/use-cases/tasks/GetTasks';
import { GetTaskById } from './application/use-cases/tasks/GetTaskById';
import { UpdateTask } from './application/use-cases/tasks/UpdateTask';
import { DeleteTask } from './application/use-cases/tasks/DeleteTask';
import { SetTaskCover } from './application/use-cases/tasks/SetTaskCover';

// Presentation
import { AuthController } from './presentation/controllers/AuthController';
import { TaskController } from './presentation/controllers/TaskController';
import { createAuthRoutes } from './presentation/routes/authRoutes';
import { createTaskRoutes } from './presentation/routes/taskRoutes';
import { makeAuthMiddleware } from './presentation/middlewares/authMiddleware';
import { errorHandler, notFoundHandler } from './presentation/middlewares/errorHandler';

export function createApp(): Express {
  // --- Wire dependencies (inside → out) ---
  const userRepo = new MongoUserRepository();
  const taskRepo = new MongoTaskRepository();
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService();
  const storage = new LocalFileStorage();
  const taskCache = new RedisTaskCache();

  const authController = new AuthController(
    new RegisterUser(userRepo, hasher, tokens),
    new LoginUser(userRepo, hasher, tokens),
    new GetCurrentUser(userRepo)
  );

  const taskController = new TaskController(
    new CreateTask(taskRepo, taskCache),
    new GetTasks(taskRepo, taskCache),
    new GetTaskById(taskRepo),
    new UpdateTask(taskRepo, taskCache),
    new DeleteTask(taskRepo, taskCache),
    new SetTaskCover(taskRepo, storage, taskCache),
    storage
  );

  const authMiddleware = makeAuthMiddleware(tokens);

  // --- Build the Express app ---
  const app = express();

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());

  // Serve uploaded files statically (cover images).
  app.use(UPLOAD_ROUTE, express.static(UPLOAD_DIR));

  // Health check (handy for the reviewer / deploy).
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRoutes(authController, authMiddleware));
  app.use('/api/tasks', createTaskRoutes(taskController, authMiddleware));

  // Unknown /api/* routes → JSON 404 (must come before the SPA fallback so API
  // calls never receive index.html).
  app.use('/api', notFoundHandler);

  // Single-service deploy: serve the built frontend (static assets + SPA
  // fallback) so the same server hosts both the API and the React app.
  if (env.SERVE_CLIENT && env.CLIENT_DIST_PATH) {
    const clientDist = path.resolve(env.CLIENT_DIST_PATH);
    app.use(express.static(clientDist));
    // Any non-API, non-file route returns index.html so React Router handles it.
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    // API-only mode: anything unmatched is a 404.
    app.use(notFoundHandler);
  }

  // Central error handler last.
  app.use(errorHandler);

  return app;
}
