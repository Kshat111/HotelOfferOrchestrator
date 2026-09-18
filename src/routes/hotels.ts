import axios from 'axios';
import { Request, Response, Router } from 'express';
import { z } from 'zod';

import { config } from '../config.js';
import {
  getOffersInPriceRange,
  redisClient,
  slugify,
} from '../services/redisCache.js';
import { getTemporalClient } from '../services/temporalClient.js';
import { HotelOffer } from '../types/hotel.js';

const SUPPLIER_HEALTH_TIMEOUT_MS = 1500;
const TASK_QUEUE = 'hotel-offer-orchestrator';

const priceQuery = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? value : value),
  z
    .string()
    .trim()
    .min(1)
    .refine((value) => Number.isFinite(Number(value)), 'must be a number')
    .transform(Number)
    .refine((value) => value >= 0, 'must be non-negative'),
);

export const hotelQuery = z
  .object({
    city: z.string().trim().min(1, 'is required').max(100, 'is too long'),
    minPrice: priceQuery.optional(),
    maxPrice: priceQuery.optional(),
  })
  .superRefine((query, context) => {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minPrice'],
        message: 'must be less than or equal to maxPrice',
      });
    }
  });

type DependencyStatus = {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validationMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'query'} ${issue.message}`)
    .join('; ');
}

async function checkSupplier(url: string): Promise<DependencyStatus> {
  const startedAt = Date.now();

  try {
    await axios.get(`${url}/hotels`, { timeout: SUPPLIER_HEALTH_TIMEOUT_MS });
    return { status: 'up', latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { status: 'down', error: errorMessage(error) };
  }
}

async function checkRedis(): Promise<DependencyStatus> {
  const startedAt = Date.now();

  try {
    await redisClient.ping();
    return { status: 'up', latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { status: 'down', error: errorMessage(error) };
  }
}

async function checkTemporal(): Promise<DependencyStatus> {
  const startedAt = Date.now();

  try {
    await getTemporalClient().workflowService.getSystemInfo({});
    return { status: 'up', latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { status: 'down', error: errorMessage(error) };
  }
}

export const hotelsRouter = Router();

hotelsRouter.get(
  '/hotels',
  async (request: Request, response: Response): Promise<void> => {
    const parsedQuery = hotelQuery.safeParse(request.query);

    if (!parsedQuery.success) {
      response.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: validationMessage(parsedQuery.error),
        },
      });
      return;
    }

    const { city, minPrice, maxPrice } = parsedQuery.data;

    try {
      const workflowResult = await getTemporalClient().workflow.execute(
        'HotelAggregationWorkflow',
        {
          args: [city],
          taskQueue: TASK_QUEUE,
          workflowId: `hotel-agg-${slugify(city, '')}`,
        },
      );
      const offers: HotelOffer[] =
        minPrice !== undefined || maxPrice !== undefined
          ? await getOffersInPriceRange(city, minPrice, maxPrice)
          : workflowResult;

      response.json(offers);
    } catch (error) {
      response.status(503).json({
        error: {
          code: 'ORCHESTRATION_UNAVAILABLE',
          message: errorMessage(error),
        },
      });
    }
  },
);

export const healthRouter = Router();

healthRouter.get(
  '/health',
  async (_request: Request, response: Response): Promise<void> => {
    const [supplierA, supplierB, redis, temporal] = await Promise.all([
      checkSupplier(config.SUPPLIER_A_URL),
      checkSupplier(config.SUPPLIER_B_URL),
      checkRedis(),
      checkTemporal(),
    ]);
    const status =
      redis.status === 'down' || temporal.status === 'down'
        ? 'down'
        : supplierA.status === 'down' || supplierB.status === 'down'
          ? 'degraded'
          : 'ok';

    response.json({
      status,
      suppliers: { supplierA, supplierB },
      redis,
      temporal,
    });
  },
);
