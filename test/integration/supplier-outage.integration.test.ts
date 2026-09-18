import request from 'supertest';

import { supplierBHotels } from '../../src/routes/supplierData.js';
import { HotelOffer } from '../../src/types/hotel.js';

// Run the real outage test with: docker compose -f docker-compose.yml -f docker-compose.outage.yml up --build
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function normalizedNames(hotels: HotelOffer[]): string[] {
  return hotels.map((hotel) => hotel.name.trim().toLowerCase());
}

describe('supplier outage integration', () => {
  it('supports a direct simulated Supplier A outage', async () => {
    const response = await request(baseUrl)
      .get('/supplierA/hotels')
      .query({ simulateDown: true });

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(response.status).toBeLessThan(600);
  });

  const outageEnabled = process.env.SIMULATE_SUPPLIER_DOWN === 'a';
  const outageTest = outageEnabled ? it : it.skip;

  outageTest(
    'degrades through the real workflow to Supplier B only when SIMULATE_SUPPLIER_DOWN=a',
    async () => {
      const aggregationResponse = await request(baseUrl)
        .get('/api/hotels')
        .query({ city: 'delhi' });
      const healthResponse = await request(baseUrl).get('/health');

      expect(aggregationResponse.status).toBe(200);
      expect(aggregationResponse.body).toEqual(
        expect.arrayContaining(
          supplierBHotels.delhi.map((hotel) =>
            expect.objectContaining({
              name: hotel.name,
              price: hotel.price,
              supplier: 'Supplier B',
            }),
          ),
        ),
      );
      expect(normalizedNames(aggregationResponse.body)).not.toContain(
        'old fort lodge',
      );
      expect(aggregationResponse.body.every((offer: HotelOffer) => offer.supplier === 'Supplier B')).toBe(true);
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.suppliers.supplierA.status).toBe('down');
    },
  );
});
