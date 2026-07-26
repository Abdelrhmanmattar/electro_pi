/**
 * Auth HTTP controller (presentation layer).
 *
 * Thin adapter: reads the validated request, invokes the use case, and shapes
 * the HTTP response. No business logic lives here.
 */
import type { Request, Response } from 'express';
import type { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import type { LoginUser } from '../../application/use-cases/auth/LoginUser';
import type { GetCurrentUser } from '../../application/use-cases/auth/GetCurrentUser';
import { UnauthorizedError } from '../../application/errors/AppError';
import type { RegisterBody, LoginBody } from '../validation/authSchemas';

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly getCurrentUser: GetCurrentUser
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RegisterBody;
    const result = await this.registerUser.execute(body);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as LoginBody;
    const result = await this.loginUser.execute(body);
    res.status(200).json(result);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.userId) throw new UnauthorizedError();
    const user = await this.getCurrentUser.execute(req.userId);
    res.status(200).json({ user });
  };
}
