import { EventEmitter } from 'node:events'
import type { Redis } from 'ioredis'
import { expect, test, vi } from 'vitest'
import redisEmitter, {
  escapeGlob,
} from '../dist/server/emitter/redis-emitter.js'

function fakeRedis() {
  const events = new EventEmitter()
  const stub = {
    duplicate: vi.fn(() => stub),
    on: vi.fn((event: string, handler: (...args: string[]) => void) =>
      events.on(event, handler),
    ),
    emit: events.emit.bind(events),
    off: vi.fn(),
    connect: vi.fn(async () => {}),
    psubscribe: vi.fn(async () => {}),
    punsubscribe: vi.fn(async () => {}),
    publish: vi.fn(async () => 1),
  }
  return stub
}

const asRedis = (stub: ReturnType<typeof fakeRedis>) => stub as unknown as Redis

test.each([
  ['plain', 'plain'],
  ['a*b', 'a\\*b'],
  ['a?b', 'a\\?b'],
  ['[abc]', '\\[abc\\]'],
  ['a\\b', 'a\\\\b'],
])('escapeGlob(%s)', (input, expected) => {
  expect(escapeGlob(input)).toBe(expected)
})

test('one dispatcher serves unrelated subscriptions and removes once handlers before delivery', async () => {
  const redis = fakeRedis()
  const events = redisEmitter(asRedis(redis))
  const unrelated = vi.fn()
  const once = vi.fn(() => redis.emit('pmessage', 'active', 'active', '[]'))
  await events.on('unrelated', unrelated)
  await events.once('active', once)
  redis.emit('pmessage', 'active', 'active', '[]')
  expect(once).toHaveBeenCalledTimes(1)
  expect(unrelated).not.toHaveBeenCalled()
  expect(
    redis.on.mock.calls.filter(([name]) => name === 'pmessage'),
  ).toHaveLength(1)
})

test('failed commands and malformed payloads do not create unhandled rejections', async () => {
  const redis = fakeRedis()
  const events = redisEmitter(asRedis(redis))
  const handler = vi.fn()
  await events.on('active', handler)
  redis.publish.mockRejectedValueOnce(new Error('Redis unavailable'))
  await expect(events.emit('active')).resolves.toBeUndefined()
  redis.emit('pmessage', 'active', 'active', '{')
  redis.emit('pmessage', 'active', 'active', '{}')
  expect(handler).not.toHaveBeenCalled()
  redis.emit('pmessage', 'active', 'active', '[1]')
  expect(handler).toHaveBeenCalledWith(1)
})

test('failed connection initialization is handled without an error listener', async () => {
  const redis = fakeRedis()
  redis.connect.mockRejectedValueOnce(new Error('Redis unavailable'))
  const events = redisEmitter(asRedis(redis))
  await expect(events.emit('active')).resolves.toBeUndefined()
})

test('subscribes with an escaped pattern but publishes to the literal channel', async () => {
  const redis = fakeRedis()
  const em = redisEmitter(asRedis(redis), 'scope')
  await em.on('a*b', () => {})
  expect(redis.psubscribe).toHaveBeenCalledWith('scope:a\\*b')
  await em.emit('a*b', { x: 1 })
  expect(redis.publish).toHaveBeenCalledWith(
    'scope:a*b',
    JSON.stringify([{ x: 1 }]),
  )
})

test('delivers a pmessage whose pattern is the escaped name', async () => {
  const redis = fakeRedis()
  const em = redisEmitter(asRedis(redis), '')
  const handler = vi.fn()
  await em.on('a*b', handler)
  const call = redis.on.mock.calls.find(([ev]) => ev === 'pmessage') as
    | unknown[]
    | undefined
  const pmessage = call![1] as (p: string, c: string, m: string) => void
  pmessage('a\\*b', 'a*b', JSON.stringify(['hello']))
  expect(handler).toHaveBeenCalledWith('hello')
})

test('removing the last listener unsubscribes the escaped pattern', async () => {
  const redis = fakeRedis()
  const em = redisEmitter(asRedis(redis), 'scope')
  const h = () => {}
  await em.on('a*b', h)
  await em.removeListener('a*b', h)
  expect(redis.punsubscribe).toHaveBeenCalledWith('scope:a\\*b')
})
