import request from 'supertest';

import { supplierAHotels, supplierBHotels } from '../../src/routes/supplierData.js';
import { HotelOffer } from '../../src/types/hotel.js';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function normalizedName(name: string): string {
  return name.trim().toLowerCase();
}

function expectedCheapestOffers(): Map<string, number> {
  const prices = new Map<string, number>();

  for (const hotel of [...supplierAHotels.delhi, ...supplierBHotels.delhi]) {
    const key = normalizedName(hotel.name);
    const currentPrice = prices.get(key);
    if (currentPrice === undefined || hotel.price < currentPrice) {
      prices.set(key, hotel.price);
    }
  }

  return prices;
}

describe('hotels integration', () => {
  it('aggregates Delhi without duplicates and selects seeded cheapest prices', async () => {
    const response = await request(baseUrl).get('/api/hotels').query({ city: 'delhi' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const offers = response.body as HotelOffer[];
    const names = offers.map((offer) => normalizedName(offer.name));
    expect(new Set(names).size).toBe(names.length);

    const expectedPrices = expectedCheapestOffers();
    for (const offer of offers) {
      expect(offer.price).toBe(expectedPrices.get(normalizedName(offer.name)));
    }
  });

  it('filters Delhi offers through the configured price range', async () => {
    const allResponse = await request(baseUrl).get('/api/hotels').query({ city: 'delhi' });
    const filteredResponse = await request(baseUrl)
      .get('/api/hotels')
      .query({ city: 'delhi', minPrice: 90, maxPrice: 110 });

    expect(allResponse.status).toBe(200);
    expect(filteredResponse.status).toBe(200);
    expect(filteredResponse.body.length).toBeLessThan(allResponse.body.length);
    expect(filteredResponse.body.every((offer: HotelOffer) => offer.price >= 90 && offer.price <= 110)).toBe(true);
  });

  it('returns an empty array for an unknown city', async () => {
    const response = await request(baseUrl).get('/api/hotels').query({ city: 'atlantis' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('rejects a missing city', async () => {
    const response = await request(baseUrl).get('/api/hotels');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBeDefined();
    expect(response.body.error.message).toBeDefined();
  });

  it('rejects a non-numeric minimum price', async () => {
    const response = await request(baseUrl)
      .get('/api/hotels')
      .query({ city: 'delhi', minPrice: 'abc' });

    expect(response.status).toBe(400);
  });

  it('rejects an inverted price range', async () => {
    const response = await request(baseUrl)
      .get('/api/hotels')
      .query({ city: 'delhi', minPrice: 100, maxPrice: 50 });

    expect(response.status).toBe(400);
  });
});
