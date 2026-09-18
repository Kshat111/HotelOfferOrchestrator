import { Hotel } from '../types/hotel.js';

type CitySeeds = Record<string, Hotel[]>;

export const supplierAHotels: CitySeeds = {
  delhi: [
    { hotelId: 'a-delhi-001', name: 'The Grand Palace', price: 120, city: 'Delhi', commissionPct: 12 },
    { hotelId: 'a-delhi-002', name: 'Metro Suites', price: 95, city: 'Delhi', commissionPct: 10 },
    { hotelId: 'a-delhi-003', name: 'Riverside Inn', price: 80, city: 'Delhi', commissionPct: 8 },
    { hotelId: 'a-delhi-004', name: 'Lotus Residency', price: 110, city: 'Delhi', commissionPct: 9 },
    { hotelId: 'a-delhi-005', name: 'Old Fort Lodge', price: 70, city: 'Delhi', commissionPct: 7 },
  ],
  mumbai: [
    { hotelId: 'a-mumbai-001', name: 'The Grand Palace', price: 155, city: 'Mumbai', commissionPct: 13 },
    { hotelId: 'a-mumbai-002', name: 'Metro Suites', price: 130, city: 'Mumbai', commissionPct: 11 },
    { hotelId: 'a-mumbai-003', name: 'Riverside Inn', price: 105, city: 'Mumbai', commissionPct: 9 },
    { hotelId: 'a-mumbai-004', name: 'Lotus Residency', price: 145, city: 'Mumbai', commissionPct: 10 },
    { hotelId: 'a-mumbai-005', name: 'Harbour View Hotel', price: 125, city: 'Mumbai', commissionPct: 8 },
  ],
};

export const supplierBHotels: CitySeeds = {
  delhi: [
    { hotelId: 'b-delhi-001', name: 'The Grand Palace', price: 115, city: 'Delhi', commissionPct: 14 },
    { hotelId: 'b-delhi-002', name: 'Metro Suites', price: 100, city: 'Delhi', commissionPct: 9 },
    { hotelId: 'b-delhi-003', name: 'Riverside Inn', price: 85, city: 'Delhi', commissionPct: 7 },
    { hotelId: 'b-delhi-004', name: 'Lotus Residency', price: 105, city: 'Delhi', commissionPct: 11 },
    { hotelId: 'b-delhi-005', name: 'Connaught Court', price: 90, city: 'Delhi', commissionPct: 6 },
  ],
  mumbai: [
    { hotelId: 'b-mumbai-001', name: 'The Grand Palace', price: 160, city: 'Mumbai', commissionPct: 12 },
    { hotelId: 'b-mumbai-002', name: 'Metro Suites', price: 125, city: 'Mumbai', commissionPct: 12 },
    { hotelId: 'b-mumbai-003', name: 'Riverside Inn', price: 115, city: 'Mumbai', commissionPct: 8 },
    { hotelId: 'b-mumbai-004', name: 'Lotus Residency', price: 140, city: 'Mumbai', commissionPct: 12 },
    { hotelId: 'b-mumbai-005', name: 'Seaside Pavilion', price: 135, city: 'Mumbai', commissionPct: 9 },
  ],
};
