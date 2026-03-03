import { createClient } from 'redis'
import { config } from '../config/env'
import { logger } from './logger'

let redisClient: ReturnType<typeof createClient> | null = null

export async function connectRedis() {
  redisClient = createClient({ url: config.redisUrl })

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err)
  })

  await redisClient.connect()
  logger.info('Connected to Redis')
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis not connected')
  }
  return redisClient
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number) {
  const client = getRedisClient()
  if (ttlSeconds) {
    await client.setEx(key, ttlSeconds, value)
  } else {
    await client.set(key, value)
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedisClient()
  return await client.get(key)
}

export async function cacheDelete(key: string) {
  const client = getRedisClient()
  await client.del(key)
}
