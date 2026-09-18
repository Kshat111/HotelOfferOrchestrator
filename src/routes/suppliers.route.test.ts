import express from 'express';
import request from 'supertest';

import { supplierAHotels, supplierBHotels } from './supplierData.js';
import { supplierARouter, supplierBRouter } from './suppliers.js';

function createTestApp(): express.Express {
  const testApp = express();
  testApp.use('/supplierA', supplierARouter);
  testApp.use('/supplierB', supplierBRouter);
  return testApp;
}

describe('supplier routes', () => {
  afterEach(() => {
    delete process.env.SIMULATE_SUPPLIER_DOWN;
  });

  it('returns Supplier A Delhi seeds', async () => {
    const response = await request(createTestApp())
      .get('/supplierA/hotels')
      .query({ city: 'delhi' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(supplierAHotels.delhi);
  });

  it('returns an empty array for an unknown Supplier A city', async () => {
    const response = await request(createTestApp())
      .get('/supplierA/hotels')
      .query({ city: 'unknown-city' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('supports a direct Supplier A outage query', async () => {
    const response = await request(createTestApp())
      .get('/supplierA/hotels')
      .query({ simulateDown: true });

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it('supports a Supplier A outage from the environment', async () => {
    process.env.SIMULATE_SUPPLIER_DOWN = 'a';

    const response = await request(createTestApp())
      .get('/supplierA/hotels')
      .query({ city: 'delhi' });

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it('returns Supplier B Delhi seeds', async () => {
    const response = await request(createTestApp())
      .get('/supplierB/hotels')
      .query({ city: 'delhi' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(supplierBHotels.delhi);
  });

  it('returns an empty array for an unknown Supplier B city', async () => {
    const response = await request(createTestApp())
      .get('/supplierB/hotels')
      .query({ city: 'unknown-city' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('supports a direct Supplier B outage query', async () => {
    const response = await request(createTestApp())
      .get('/supplierB/hotels')
      .query({ simulateDown: true });

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it('supports a Supplier B outage from the environment', async () => {
    process.env.SIMULATE_SUPPLIER_DOWN = 'b';

    const response = await request(createTestApp())
      .get('/supplierB/hotels')
      .query({ city: 'delhi' });

    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});
