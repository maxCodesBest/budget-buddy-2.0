import type { Request } from 'express';

export type AuthenticatedUser = {
  userId: string;
  username: string;
};

export type RequestWithUser = Request & { user?: AuthenticatedUser };
