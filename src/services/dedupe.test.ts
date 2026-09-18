import { dedupeAndSelect } from './dedupe.js';
import { Hotel } from '../types/hotel.js';

function hotel(name: string, price: number, commissionPct: number): Hotel {
  return {
    hotelId: name.toLowerCase().replaceAll(' ', '-'),
    name,
    price,
    city: 'Delhi',
    commissionPct,
  };
}

describe('dedupeAndSelect', () => {
  it('selects supplier A when A is cheaper', () => {
    const [offer] = dedupeAndSelect(
      [hotel('City Hotel', 90, 10)],
      [hotel('City Hotel', 100, 5)],
    );

    expect(offer).toEqual({
      name: 'City Hotel',
      price: 90,
      supplier: 'Supplier A',
      commissionPct: 10,
    });
  });

  it('selects supplier B when B is cheaper', () => {
    const [offer] = dedupeAndSelect(
      [hotel('City Hotel', 100, 5)],
      [hotel('City Hotel', 90, 10)],
    );

    expect(offer.supplier).toBe('Supplier B');
    expect(offer.price).toBe(90);
  });

  it('uses commissionPct as the exact-price tie-breaker', () => {
    const [offer] = dedupeAndSelect(
      [hotel('City Hotel', 90, 12)],
      [hotel('City Hotel', 90, 8)],
    );

    expect(offer).toMatchObject({
      supplier: 'Supplier B',
      commissionPct: 8,
    });
  });

  it('prefers supplier A when price and commissionPct are tied', () => {
    const [offer] = dedupeAndSelect(
      [hotel('City Hotel', 90, 8)],
      [hotel('City Hotel', 90, 8)],
    );

    expect(offer.supplier).toBe('Supplier A');
  });

  it('passes through a hotel found only in supplier A', () => {
    expect(dedupeAndSelect([hotel('A Hotel', 90, 8)], [])).toEqual([
      {
        name: 'A Hotel',
        price: 90,
        supplier: 'Supplier A',
        commissionPct: 8,
      },
    ]);
  });

  it('passes through a hotel found only in supplier B', () => {
    expect(dedupeAndSelect([], [hotel('B Hotel', 90, 8)])).toEqual([
      {
        name: 'B Hotel',
        price: 90,
        supplier: 'Supplier B',
        commissionPct: 8,
      },
    ]);
  });

  it('handles an empty supplier list', () => {
    expect(dedupeAndSelect([], [])).toEqual([]);
  });

  it('deduplicates names case-insensitively and after trimming whitespace', () => {
    const result = dedupeAndSelect(
      [hotel('  The Grand Palace  ', 120, 10)],
      [hotel('the grand palace', 110, 12)],
    );

    expect(result).toEqual([
      {
        name: 'the grand palace',
        price: 110,
        supplier: 'Supplier B',
        commissionPct: 12,
      },
    ]);
  });
});
