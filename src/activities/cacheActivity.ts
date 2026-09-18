import { writeOffers } from '../services/redisCache.js';
import { HotelOffer } from '../types/hotel.js';

export function cacheToRedis(
  city: string,
  offers: HotelOffer[],
): Promise<void> {
  return writeOffers(city, offers);
}
