/**
 * Prisma client singleton for Next.js
 * - Prevents "too many connections" in development (hot reload)
 * - Uses connection pooling in production (Railway)
 * - Supports DIRECT_URL for migrations when using pooled connections
 */

import { PrismaClient } from '.prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Global cache for development hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Create pool with sensible defaults for Railway
  const pool = new pg.Pool({
    connectionString,
    max: 10, // Max connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Fail connection after 10s
  })

  // Handle pool errors gracefully
  pool.on('error', (err) => {
    console.error('[prisma] Pool error:', err.message)
  })

  const adapter = new PrismaPg(pool)

  // Store pool reference for health checks
  globalForPrisma.pool = pool

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

// Lazy initialization with global caching
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    return globalForPrisma.prisma[prop as keyof PrismaClient]
  },
})

/**
 * Check if database is reachable
 * Returns { ok: true } or { ok: false, error: string }
 */
export async function checkDatabaseHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    // Sanitize error message to avoid leaking secrets
    const safeError = message
      .replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***@')
      .replace(/password=[^&\s]+/gi, 'password=***')
      .slice(0, 200)
    return { ok: false, error: safeError }
  }
}

/**
 * Get analytics stats for health check
 */
export async function getAnalyticsStats(): Promise<{
  eventCountLast24h: number
  latestEventAt: string | null
}> {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [countResult, latestResult] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { createdAt: { gte: since24h } },
      }),
      prisma.analyticsEvent.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ])

    return {
      eventCountLast24h: countResult,
      latestEventAt: latestResult?.createdAt?.toISOString() || null,
    }
  } catch {
    return {
      eventCountLast24h: -1,
      latestEventAt: null,
    }
  }
}
