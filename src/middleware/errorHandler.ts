import { NextFunction, Request, Response } from 'express';

import { logger } from './requestLogger.js';

type ErrorWithDetails = {
  code?: unknown;
  statusCode?: unknown;
  message?: unknown;
};

function statusCode(error: unknown): number {
  if (typeof error === 'object' && error !== null) {
    const candidate = (error as ErrorWithDetails).statusCode;
    if (typeof candidate === 'number' && candidate >= 400 && candidate < 600) {
      return candidate;
    }
  }

  return 500;
}

function errorCode(error: unknown, status: number): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = (error as ErrorWithDetails).code;
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  const status = statusCode(error);
  const code = errorCode(error, status);
  const production = process.env.NODE_ENV === 'production';
  const message = production && status >= 500 ? 'Internal server error' : errorMessage(error);
  const requestId = response.getHeader('x-request-id');

  logger.error(
    {
      requestId,
      method: request.method,
      path: request.path,
      status,
      code,
    },
    'request failed',
  );

  response.status(status).json({ error: { code, message } });
}
