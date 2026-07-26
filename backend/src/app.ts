/**
 * Composition root (presentation layer).
 *
 * The ONE place where concrete implementations are instantiated and injected
 * into the layers that depend on abstractions. Everything above this file
 * depends only on interfaces; here we choose Mongo + bcrypt + JWT + Express.
 */
import express, { type Express } from 'express';
import cors from 'cors';

import { env } from './config/env';

// Infrastructure (concrete)
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { MongoTaskRepository } from './infrastructure/repositories/MongoTaskRepository';
import { BcryptPasswordHasher } from './infrastructure/security/BcryptPasswordHasher';
import { JwtTokenService } from './infrastructure/security/JwtTokenService';

// Application (use cases)
import { RegisterUser } from './application/use-cases/auth/RegisterUser';
import { LoginUser } from './application/use-cases/auth/LoginUser';
import { GetCurrentUser } from './application/use-cases/auth/GetCurrentUser';
import { CreateTask } from './application/use-cases/tasks/CreateTask';
import { GetTasks } from './application/use-cases/tasks/GetTasks';
import { GetTaskById } from './application/use-cases/tasks/GetTaskById';
import { UpdateTask } from './application/use-cases/tasks/UpdateTask';
import { DeleteTask } from './application/use-cases/tasks/DeleteTask';

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

  const authController = new AuthController(
    new RegisterUser(userRepo, hasher, tokens),
    new LoginUser(userRepo, hasher, tokens),
    new GetCurrentUser(userRepo)
  );

  const taskController = new TaskController(
    new CreateTask(taskRepo),
    new GetTasks(taskRepo),
    new GetTaskById(taskRepo),
    new UpdateTask(taskRepo),
    new DeleteTask(taskRepo)
  );

  const authMiddleware = makeAuthMiddleware(tokens);

  // --- Build the Express app ---
  const app = express();

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());

  // Health check (handy for the reviewer / deploy).
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRoutes(authController, authMiddleware));
  app.use('/api/tasks', createTaskRoutes(taskController, authMiddleware));

  // 404 for anything unmatched, then the central error handler last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
