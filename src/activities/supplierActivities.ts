import { Context } from '@temporalio/activity';
import axios from 'axios';

import { config } from '../config.js';
import { Hotel } from '../types/hotel.js';

const SUPPLIER_TIMEOUT_MS = 3000;

type SupplierName = 'Supplier A' | 'Supplier B';

function activityAttempt(): number {
  return Context.current().info.attempt;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function fetchSupplier(
  supplier: SupplierName,
  baseUrl: string,
  city: string,
): Promise<Hotel[]> {
  const activity = `fetch${supplier.replace(' ', '')}`;
  const startedAt = Date.now();
  const attempt = activityAttempt();

  console.info(
    JSON.stringify({
      activity,
      city,
      attempt,
      durationMs: 0,
    }),
  );

  try {
    const response = await axios.get<Hotel[]>(`${baseUrl}/hotels`, {
      params: { city },
      timeout: SUPPLIER_TIMEOUT_MS,
    });
    const durationMs = Date.now() - startedAt;

    console.info(
      JSON.stringify({
        activity,
        city,
        attempt,
        durationMs,
      }),
    );

    return response.data;
  } catch (error) {
    console.error(
      JSON.stringify({
        activity,
        city,
        attempt,
        durationMs: Date.now() - startedAt,
        error: errorMessage(error),
      }),
    );
    throw error;
  }
}

export function fetchSupplierA(city: string): Promise<Hotel[]> {
  return fetchSupplier('Supplier A', config.SUPPLIER_A_URL, city);
}

export function fetchSupplierB(city: string): Promise<Hotel[]> {
  return fetchSupplier('Supplier B', config.SUPPLIER_B_URL, city);
}
