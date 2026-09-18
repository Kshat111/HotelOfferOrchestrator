import {
  log as workflowLog,
  proxyActivities,
} from '@temporalio/workflow';

import type * as cacheActivities from '../activities/cacheActivity.js';
import type * as supplierActivities from '../activities/supplierActivities.js';
import { dedupeAndSelect } from '../services/dedupe.js';
import { Hotel, HotelOffer } from '../types/hotel.js';

const supplierActivityOptions = {
  startToCloseTimeout: '3 seconds',
  retry: {
    initialInterval: '100 milliseconds',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
};

const cacheActivityOptions = {
  startToCloseTimeout: '3 seconds',
  retry: {
    initialInterval: '100 milliseconds',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
};

const { fetchSupplierA, fetchSupplierB } = proxyActivities<
  typeof supplierActivities
>(supplierActivityOptions);
const { cacheToRedis } = proxyActivities<typeof cacheActivities>(
  cacheActivityOptions,
);

async function fetchWithFallback(
  activity: (city: string) => Promise<Hotel[]>,
  supplier: 'Supplier A' | 'Supplier B',
  city: string,
): Promise<Hotel[]> {
  try {
    return await activity(city);
  } catch (error) {
    workflowLog.warn('supplier failed after retries; continuing with empty result', {
      city,
      supplier,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function HotelAggregationWorkflow(
  city: string,
): Promise<HotelOffer[]> {
  workflowLog.info('workflow started', { city });

  const [listA, listB] = await Promise.all([
    fetchWithFallback(fetchSupplierA, 'Supplier A', city),
    fetchWithFallback(fetchSupplierB, 'Supplier B', city),
  ]);

  workflowLog.info('suppliers fetched', {
    city,
    supplierACount: listA.length,
    supplierBCount: listB.length,
  });

  const offers = dedupeAndSelect(listA, listB);
  workflowLog.info('offers deduped', { city, count: offers.length });

  await cacheToRedis(city, offers);
  workflowLog.info('offers cached', { city, count: offers.length });

  return offers;
}
