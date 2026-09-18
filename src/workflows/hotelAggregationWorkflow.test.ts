import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';

import { Hotel, HotelOffer } from '../types/hotel.js';
import { HotelAggregationWorkflow } from './hotelAggregationWorkflow.js';

const taskQueue = 'hotel-offer-orchestrator-test';

jest.setTimeout(30000);

const supplierAHotels: Hotel[] = [
  {
    hotelId: 'a-1',
    name: 'Grand Palace',
    price: 120,
    city: 'Delhi',
    commissionPct: 10,
  },
];

const supplierBHotels: Hotel[] = [
  {
    hotelId: 'b-1',
    name: 'Grand Palace',
    price: 100,
    city: 'Delhi',
    commissionPct: 8,
  },
];

const expectedOffer: HotelOffer = {
  name: 'Grand Palace',
  price: 100,
  supplier: 'Supplier B',
  commissionPct: 8,
};

type ActivityMocks = {
  fetchSupplierA: jest.Mock<Promise<Hotel[]>, [string]>;
  fetchSupplierB: jest.Mock<Promise<Hotel[]>, [string]>;
  cacheToRedis: jest.Mock<Promise<void>, [string, HotelOffer[]]>;
};

async function executeWorkflow(
  testEnv: TestWorkflowEnvironment,
): Promise<HotelOffer[]> {
  return testEnv.client.workflow.execute(HotelAggregationWorkflow, {
    args: ['Delhi'],
    taskQueue,
    workflowId: `hotel-aggregation-${Date.now()}-${Math.random()}`,
  });
}

async function runWithActivities(
  testEnv: TestWorkflowEnvironment,
  activities: ActivityMocks,
): Promise<HotelOffer[]> {
  return Worker.create({
    connection: testEnv.nativeConnection,
    workflowsPath: require.resolve('./hotelAggregationWorkflow.ts'),
    activities,
    taskQueue,
  }).then(async (worker) => worker.runUntil(() => executeWorkflow(testEnv)));
}

describe('HotelAggregationWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.teardown();
    }
  });

  it('completes when both suppliers succeed', async () => {
    const activities: ActivityMocks = {
      fetchSupplierA: jest.fn().mockResolvedValue(supplierAHotels),
      fetchSupplierB: jest.fn().mockResolvedValue(supplierBHotels),
      cacheToRedis: jest.fn().mockResolvedValue(undefined),
    };

    await expect(runWithActivities(testEnv, activities)).resolves.toEqual([
      expectedOffer,
    ]);
    expect(activities.cacheToRedis).toHaveBeenCalledWith('Delhi', [expectedOffer]);
  });

  it('continues with supplier B when supplier A fails all retries', async () => {
    const activities: ActivityMocks = {
      fetchSupplierA: jest.fn().mockRejectedValue(new Error('supplier A down')),
      fetchSupplierB: jest.fn().mockResolvedValue(supplierBHotels),
      cacheToRedis: jest.fn().mockResolvedValue(undefined),
    };

    await expect(runWithActivities(testEnv, activities)).resolves.toEqual([
      expectedOffer,
    ]);
    expect(activities.fetchSupplierA).toHaveBeenCalledTimes(3);
  });

  it('completes with an empty array when both suppliers fail all retries', async () => {
    const activities: ActivityMocks = {
      fetchSupplierA: jest.fn().mockRejectedValue(new Error('supplier A down')),
      fetchSupplierB: jest.fn().mockRejectedValue(new Error('supplier B down')),
      cacheToRedis: jest.fn().mockResolvedValue(undefined),
    };

    await expect(runWithActivities(testEnv, activities)).resolves.toEqual([]);
    expect(activities.fetchSupplierA).toHaveBeenCalledTimes(3);
    expect(activities.fetchSupplierB).toHaveBeenCalledTimes(3);
    expect(activities.cacheToRedis).toHaveBeenCalledWith('Delhi', []);
  });
});
