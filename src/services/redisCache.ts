import Redis from 'ioredis';

import { HotelOffer } from '../types/hotel.js';

const DEFAULT_TTL_SECONDS = 300;
const OFFER_FIELD = 'offer';

export const redisClient = new Redis(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
);

function safeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugify(city: string, name: string): string {
  return [city, name]
    .map(safeSegment)
    .filter((segment) => segment.length > 0)
    .join('-');
}

function citySlug(city: string): string {
  return slugify(city, '');
}

function priceIndexKey(city: string): string {
  return `hotels:${citySlug(city)}:by_price`;
}

function offerKey(city: string, name: string): string {
  return `hotels:${citySlug(city)}:${slugify('', name)}`;
}

function cacheTtlSeconds(): number {
  const configuredTtl = Number(process.env.REDIS_CACHE_TTL_SECONDS);

  if (Number.isInteger(configuredTtl) && configuredTtl > 0) {
    return configuredTtl;
  }

  return DEFAULT_TTL_SECONDS;
}

export async function writeOffers(
  city: string,
  offers: HotelOffer[],
): Promise<void> {
  const indexKey = priceIndexKey(city);
  const existingSlugs = await redisClient.zrange(indexKey, 0, -1);
  const transaction = redisClient.multi();
  const ttl = cacheTtlSeconds();

  if (existingSlugs.length > 0) {
    transaction.del(
      ...existingSlugs.map((name) => offerKey(city, name)),
    );
  }

  transaction.del(indexKey);

  for (const offer of offers) {
    const key = offerKey(city, offer.name);
    const nameSlug = slugify('', offer.name);

    transaction.hset(key, OFFER_FIELD, JSON.stringify(offer));
    transaction.expire(key, ttl);
    transaction.zadd(indexKey, offer.price, nameSlug);
  }

  transaction.expire(indexKey, ttl);
  await transaction.exec();
}

export async function getOffersInPriceRange(
  city: string,
  minPrice?: number,
  maxPrice?: number,
): Promise<HotelOffer[]> {
  const minimum = minPrice ?? '-inf';
  const maximum = maxPrice ?? '+inf';
  const names = await redisClient.zrangebyscore(
    priceIndexKey(city),
    minimum,
    maximum,
  );

  const serializedOffers = await Promise.all(
    names.map((name) => redisClient.hget(offerKey(city, name), OFFER_FIELD)),
  );

  return serializedOffers
    .filter((serializedOffer): serializedOffer is string => serializedOffer !== null)
    .map((serializedOffer) => JSON.parse(serializedOffer) as HotelOffer);
}

export function getAllOffers(city: string): Promise<HotelOffer[]> {
  return getOffersInPriceRange(city);
}
