import RedisMock from 'ioredis-mock';

import {
  getAllOffers,
  getOffersInPriceRange,
  redisClient,
  writeOffers,
} from './redisCache.js';
import { HotelOffer } from '../types/hotel.js';

jest.mock('ioredis', () => RedisMock);

const offers: HotelOffer[] = [
  {
    name: 'Grand Palace',
    price: 120,
    supplier: 'Supplier A',
    commissionPct: 10,
  },
  {
    name: 'Metro Suites',
    price: 80,
    supplier: 'Supplier B',
    commissionPct: 8,
  },
  {
    name: 'Riverside Inn',
    price: 200,
    supplier: 'Supplier A',
    commissionPct: 12,
  },
];

beforeEach(async () => {
  await redisClient.flushdb();
  delete process.env.REDIS_CACHE_TTL_SECONDS;
});

afterAll(async () => {
  await redisClient.quit();
});

describe('redis cache', () => {
  it('writes offers and reads them back', async () => {
    await writeOffers('New Delhi', offers);

    await expect(getAllOffers('NEW DELHI')).resolves.toEqual([
      offers[1],
      offers[0],
      offers[2],
    ]);
  });

  it('filters by inclusive price range', async () => {
    await writeOffers('delhi', offers);

    await expect(getOffersInPriceRange('delhi', 80, 120)).resolves.toEqual([
      offers[1],
      offers[0],
    ]);
  });

  it('returns an empty array for a city with no offers', async () => {
    await expect(getAllOffers('unknown-city')).resolves.toEqual([]);
  });

  it('sets the configured TTL on the index and offer keys', async () => {
    process.env.REDIS_CACHE_TTL_SECONDS = '600';
    await writeOffers('delhi', [offers[0]]);

    await expect(redisClient.ttl('hotels:delhi:by_price')).resolves.toBe(600);
    await expect(redisClient.ttl('hotels:delhi:grand-palace')).resolves.toBe(600);
  });
});
