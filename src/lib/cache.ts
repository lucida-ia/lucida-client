// Response caching utilities for API routes
import { NextResponse } from "next/server";

// In-memory cache for serverless functions (per instance)
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache configuration
export const CACHE_TTL = {
  USER_DATA: 5 * 60 * 1000, // 5 minutes
  SUBSCRIPTION_DATA: 10 * 60 * 1000, // 10 minutes
  EXAM_LIST: 2 * 60 * 1000, // 2 minutes
  ANALYTICS: 15 * 60 * 1000, // 15 minutes
  CLASS_LIST: 10 * 60 * 1000, // 10 minutes
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
} as const;

// Cache key generators
export function generateCacheKey(
  prefix: string,
  userId?: string,
  params?: Record<string, any>
): string {
  const base = userId ? `${prefix}:${userId}` : prefix;
  if (params) {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    return `${base}?${paramString}`;
  }
  return base;
}

// Get from cache
export function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  // Check if expired
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

// Set to cache
export function setToCache<T>(key: string, data: T, ttl: number): void {
  // Limit cache size to prevent memory issues (keep last 1000 entries)
  if (cache.size >= 1000) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Clear cache for a pattern
export function clearCachePattern(pattern: string): void {
  const keys = Array.from(cache.keys());
  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Clear all cache
export function clearAllCache(): void {
  cache.clear();
}

// Cached response wrapper
export function withCache<T>(
  key: string,
  ttl: number,
  dataFetcher: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache first
      const cached = getFromCache<T>(key);
      if (cached !== null) {
        resolve(cached);
        return;
      }

      // Fetch data if not in cache
      const data = await dataFetcher();

      // Store in cache
      setToCache(key, data, ttl);

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

// Response caching middleware for API routes
export function createCachedResponse<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  const cacheHeaders = {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    "CDN-Cache-Control": "public, s-maxage=300",
    "Vercel-CDN-Cache-Control": "public, s-maxage=300",
    ...headers,
  };

  return NextResponse.json(data, {
    status,
    headers: cacheHeaders,
  });
}

// Cache invalidation helpers
export function invalidateUserCache(userId: string): void {
  clearCachePattern(`user:${userId}`);
  clearCachePattern(`subscription:${userId}`);
  clearCachePattern(`exams:${userId}`);
  clearCachePattern(`analytics:${userId}`);
}

export function invalidateExamCache(userId: string, examId?: string): void {
  clearCachePattern(`exams:${userId}`);
  clearCachePattern(`analytics:${userId}`);
  if (examId) {
    clearCachePattern(`exam:${examId}`);
  }
}

// Cache statistics for monitoring
export function getCacheStats() {
  let totalSize = 0;
  let expiredCount = 0;
  const now = Date.now();

  const entries = Array.from(cache.entries());
  for (const [key, cached] of entries) {
    totalSize++;
    if (now - cached.timestamp > cached.ttl) {
      expiredCount++;
    }
  }

  return {
    totalEntries: totalSize,
    expiredEntries: expiredCount,
    hitRate: totalSize > 0 ? ((totalSize - expiredCount) / totalSize) * 100 : 0,
  };
}
