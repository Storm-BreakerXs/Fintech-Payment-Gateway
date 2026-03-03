import { createClient } from 'redis'
import { config } from '../config/env'
import { logger } from './logger'

let redisClient: ReturnType<typeof createClient> | null = null

export async function connectRedis() {
  if (!config.redisUrl) {
    logger.warn('REDIS_URL is not set. Continuing without Redis cache.')
    return
  }

  redisClient = createClient({
    url: config.redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (config.nodeEnv === 'development') {
          return false
        }
        return Math.min(retries * 100, 3000)
      },
    },
  })

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err)
  })

  try {
    await redisClient.connect()
    logger.info('Connected to Redis')
  } catch (error) {
    redisClient = null
    if (config.isProduction) {
      throw error
    }
    logger.warn('Redis unavailable. Continuing without Redis cache.')
  }
}

export function getRedisClient() {
  if (!redisClient || !redisClient.isOpen) {
    return null
  }
  return redisClient
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number) {
  const client = getRedisClient()
  if (!client) {
    return
  }
  if (ttlSeconds) {
    await client.setEx(key, ttlSeconds, value)
  } else {
    await client.set(key, value)
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedisClient()
  if (!client) {
    return null
  }
  return await client.get(key)
}

export async function cacheDelete(key: string) {
  const client = getRedisClient()
  if (!client) {
    return
  }
  await client.del(key)
}
