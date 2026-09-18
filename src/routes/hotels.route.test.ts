import express from 'express';
import request from 'supertest';

import { HotelOffer } from '../types/hotel.js';

const executeMock = jest.fn();
const getTemporalClientMock = jest.fn(() => ({
  workflow: { execute: executeMock },
}));
const getOffersInPriceRangeMock = jest.fn();

// These files intentionally mock the same two modules with different shapes; Jest isolates each test file's module registry.
jest.mock('../services/temporalClient.js', () => ({
  getTemporalClient: getTemporalClientMock,
}));
jest.mock('../services/redisCache.js', () => ({
  getOffersInPriceRange: getOffersInPriceRangeMock,
  redisClient: { ping: jest.fn() },
  slugify: (city: string) => city.toLowerCase(),
}));

import { hotelsRouter } from './hotels.js';

const workflowOffers: HotelOffer[] = [
  { name: 'Workflow Hotel', price: 75, supplier: 'Supplier A', commissionPct: 10 },
];
const filteredOffers: HotelOffer[] = [
  { name: 'Filtered Hotel', price: 125, supplier: 'Supplier B', commissionPct: 8 },
];

function createTestApp(): express.Express {
  const testApp = express();
  testApp.use('/api', hotelsRouter);
  return testApp;
}

describe('hotels route', () => {
  beforeEach(() => {
    executeMock.mockReset().mockResolvedValue(workflowOffers);
    getOffersInPriceRangeMock.mockReset().mockResolvedValue(filteredOffers);
  });

  it('returns the raw workflow result without price filters', async () => {
    const response = await request(createTestApp())
      .get('/api/hotels')
      .query({ city: 'delhi' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(workflowOffers);
    expect(getTemporalClientMock).toHaveBeenCalled();
    expect(executeMock).toHaveBeenCalledWith(
      'HotelAggregationWorkflow',
      expect.objectContaining({ args: ['delhi'] }),
    );
    expect(getOffersInPriceRangeMock).not.toHaveBeenCalled();
  });

  it('returns the Redis-filtered result when prices are provided', async () => {
    const response = await request(createTestApp())
      .get('/api/hotels')
      .query({ city: 'delhi', minPrice: 100, maxPrice: 200 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(filteredOffers);
    expect(getOffersInPriceRangeMock).toHaveBeenCalledWith('delhi', 100, 200);
  });

  it.each([
    { query: {}, label: 'missing city' },
    { query: { city: 'delhi', minPrice: 'abc' }, label: 'non-numeric minPrice' },
    { query: { city: 'delhi', minPrice: 100, maxPrice: 50 }, label: 'inverted range' },
  ])('returns 400 for $label', async ({ query }) => {
    executeMock.mockClear();

    const response = await request(createTestApp()).get('/api/hotels').query(query);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_QUERY');
    expect(response.body.error.message).toEqual(expect.any(String));
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('returns 503 when the workflow rejects', async () => {
    executeMock.mockRejectedValueOnce(new Error('Temporal unavailable'));

    const response = await request(createTestApp())
      .get('/api/hotels')
      .query({ city: 'delhi' });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('ORCHESTRATION_UNAVAILABLE');
  });
});
