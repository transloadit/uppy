import type { Redis } from 'ioredis'
import { expect, test, vi } from 'vitest'
import redisEmitter, {
  escapeGlob,
} from '../dist/server/emitter/redis-emitter.js'

function fakeRedis() {
  const stub = {
    duplicate: vi.fn(() => stub),
    on: vi.fn(),
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
