import express from 'express';
import request from 'supertest';

const axiosGetMock = jest.fn();
const redisPingMock = jest.fn();
const getSystemInfoMock = jest.fn();
const getTemporalClientMock = jest.fn(() => ({
  workflowService: { getSystemInfo: getSystemInfoMock },
}));

// These files intentionally mock the same two modules with different shapes; Jest isolates each test file's module registry.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: axiosGetMock },
}));
jest.mock('../services/redisCache.js', () => ({
  getOffersInPriceRange: jest.fn(),
  redisClient: { ping: redisPingMock },
  slugify: (city: string) => city.toLowerCase(),
}));
jest.mock('../services/temporalClient.js', () => ({
  getTemporalClient: getTemporalClientMock,
}));

import { healthRouter } from './hotels.js';

function createTestApp(): express.Express {
  const testApp = express();
  testApp.use(healthRouter);
  return testApp;
}

describe('health route', () => {
  beforeEach(() => {
    axiosGetMock.mockReset().mockResolvedValue({ status: 200 });
    redisPingMock.mockReset().mockResolvedValue('PONG');
    getSystemInfoMock.mockReset().mockResolvedValue({});
    getTemporalClientMock.mockReset().mockReturnValue({
      workflowService: { getSystemInfo: getSystemInfoMock },
    });
  });

  it('reports healthy dependencies and suppliers', async () => {
    const response = await request(createTestApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.suppliers.supplierA.status).toBe('up');
    expect(response.body.suppliers.supplierB.status).toBe('up');
  });

  it('reports degraded when Supplier A is unavailable', async () => {
    axiosGetMock.mockImplementation((url: string) =>
      url.includes('3001')
        ? Promise.reject(new Error('Supplier A unavailable'))
        : Promise.resolve({ status: 200 }),
    );

    const response = await request(createTestApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('degraded');
    expect(response.body.suppliers.supplierA.status).toBe('down');
    expect(response.body.suppliers.supplierA.error).toContain('Supplier A unavailable');
  });

  it('reports down when Redis is unavailable', async () => {
    redisPingMock.mockRejectedValueOnce(new Error('Redis unavailable'));

    const response = await request(createTestApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('down');
    expect(response.body.redis.status).toBe('down');
  });

  it('reports Temporal down when the client is not initialized', async () => {
    getTemporalClientMock.mockImplementationOnce(() => {
      throw new Error('Temporal client has not been initialized');
    });

    const response = await request(createTestApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('down');
    expect(response.body.temporal.status).toBe('down');
    expect(response.body.temporal.error).toContain('not been initialized');
  });
});
