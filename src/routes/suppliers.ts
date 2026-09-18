import { Request, Response, Router } from 'express';

import { config } from '../config.js';
import { Hotel } from '../types/hotel.js';
import { supplierAHotels, supplierBHotels } from './supplierData.js';

function cityFromRequest(request: Request): string | undefined {
  return typeof request.query.city === 'string'
    ? request.query.city.trim().toLowerCase()
    : undefined;
}

function isSimulationDown(request: Request): boolean {
  return request.query.simulateDown === 'true';
}

function isConfiguredDown(supplier: 'a' | 'b'): boolean {
  const currentEnvironmentValue = process.env.SIMULATE_SUPPLIER_DOWN
    ?.trim()
    .toLowerCase();

  return (
    config.SIMULATE_SUPPLIER_DOWN === supplier ||
    currentEnvironmentValue === supplier
  );
}

function createSupplierRouter(
  supplier: 'a' | 'b',
  seededHotels: Record<string, Hotel[]>,
): Router {
  const router = Router();

  router.get('/hotels', (request: Request, response: Response): void => {
    if (isSimulationDown(request) || isConfiguredDown(supplier)) {
      response.status(500).json({ error: 'Simulated supplier outage' });
      return;
    }

    const city = cityFromRequest(request);
    response.json(city ? (seededHotels[city] ?? []) : []);
  });

  return router;
}

export const supplierARouter = createSupplierRouter('a', supplierAHotels);
export const supplierBRouter = createSupplierRouter('b', supplierBHotels);
