import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';
import pino from 'pino';

const logger = pino();

export function requestLogger(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID();
  const startedAt = Date.now();

  response.setHeader('x-request-id', requestId);
  response.on('finish', () => {
    logger.info(
      {
        requestId,
        method: request.method,
        path: request.path,
        status: response.statusCode,
        latencyMs: Date.now() - startedAt,
      },
      'request completed',
    );
  });

  next();
}

export { logger };
