import { Hotel, HotelOffer } from '../types/hotel.js';

type Supplier = HotelOffer['supplier'];

type Candidate = {
  hotel: Hotel;
  supplier: Supplier;
};

function normalizedName(name: string): string {
  return name.trim().toLowerCase();
}

function isPreferred(candidate: Candidate, current: Candidate): boolean {
  if (candidate.hotel.price !== current.hotel.price) {
    return candidate.hotel.price < current.hotel.price;
  }

  if (candidate.hotel.commissionPct !== current.hotel.commissionPct) {
    return candidate.hotel.commissionPct < current.hotel.commissionPct;
  }

  return candidate.supplier === 'Supplier A';
}

function toOffer(candidate: Candidate): HotelOffer {
  return {
    name: candidate.hotel.name,
    price: candidate.hotel.price,
    supplier: candidate.supplier,
    commissionPct: candidate.hotel.commissionPct,
  };
}

export function dedupeAndSelect(listA: Hotel[], listB: Hotel[]): HotelOffer[] {
  const selected = new Map<string, Candidate>();
  const sources: Array<[Hotel[], Supplier]> = [
    [listA, 'Supplier A'],
    [listB, 'Supplier B'],
  ];

  for (const [hotels, supplier] of sources) {
    for (const hotel of hotels) {
      const key = normalizedName(hotel.name);
      const candidate: Candidate = { hotel, supplier };
      const current = selected.get(key);

      if (!current || isPreferred(candidate, current)) {
        selected.set(key, candidate);
      }
    }
  }

  return Array.from(selected.values(), toOffer);
}
