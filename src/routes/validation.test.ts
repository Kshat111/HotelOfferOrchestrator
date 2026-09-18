jest.mock('../services/redisCache.js', () => ({
  getOffersInPriceRange: jest.fn(),
  redisClient: { ping: jest.fn() },
  slugify: (city: string) => city.toLowerCase(),
}));

import { hotelQuery } from './hotels.js';

describe('hotel query validation', () => {
  it('accepts a city without price filters', () => {
    const result = hotelQuery.safeParse({ city: 'delhi' });

    expect(result.success).toBe(true);
  });

  it('coerces valid price strings to numbers', () => {
    const result = hotelQuery.safeParse({
      city: 'delhi',
      minPrice: '100',
      maxPrice: '200',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPrice).toBe(100);
      expect(result.data.maxPrice).toBe(200);
    }
  });

  it('rejects a missing city', () => {
    const result = hotelQuery.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message.toLowerCase()).toContain('city');
    }
  });

  it('rejects a city over the maximum length', () => {
    const result = hotelQuery.safeParse({ city: 'd'.repeat(101) });

    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric minimum price', () => {
    const result = hotelQuery.safeParse({ city: 'delhi', minPrice: 'abc' });

    expect(result.success).toBe(false);
  });

  it('rejects minPrice greater than maxPrice at minPrice', () => {
    const result = hotelQuery.safeParse({
      city: 'delhi',
      minPrice: '100',
      maxPrice: '50',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['minPrice']);
    }
  });
});
