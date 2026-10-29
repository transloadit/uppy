import { afterEach, beforeEach, expect, test, vi } from 'vitest'

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  const redis = await import('../src/server/redis.js')
  vi.spyOn(redis, 'client').mockReturnValue(undefined)
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function fixture() {
  const { publishAuthCallback, takeAuthCallback } = await import(
    '../src/server/auth-callback.js'
  )
  const options = {
    secret: 'fixture',
    filePath: '/tmp',
    server: { host: 'localhost' },
  }
  return {
    publish: (token: string, data: object) =>
      publishAuthCallback(token, data, options),
    take: (token: string) => takeAuthCallback(token, options),
  }
}

test('retains a completed callback until subscription and consumes it once', async () => {
  const { publish, take } = await fixture()
  await publish('callback', { token: 'fixture-token' })
  expect(await take('callback')).toEqual({ token: 'fixture-token' })
  expect(await take('callback')).toBeUndefined()
})

test('expires a result even when its cleanup timer has not run', async () => {
  const { publish, take } = await fixture()
  await publish('callback', { token: 'fixture-token' })
  vi.setSystemTime(Date.now() + 61_000)
  expect(await take('callback')).toBeUndefined()
})

test('bounds pending memory by evicting the oldest result', async () => {
  const { publish, take } = await fixture()
  for (let i = 0; i <= 1000; i++)
    await publish(String(i), { token: 'fixture-token' })
  expect(await take('0')).toBeUndefined()
  expect(await take('1000')).toEqual({ token: 'fixture-token' })
  expect(vi.getTimerCount()).toBe(999)
})

test('rejects oversized results without retaining or publishing them', async () => {
  const { publish, take } = await fixture()
  const { default: emitter } = await import('../src/server/emitter/index.js')
  const listener = vi.fn()
  emitter().on('callback', listener)
  await expect(
    publish('callback', { token: 'x'.repeat(64 * 1024) }),
  ).rejects.toThrow('OAuth callback retention failed')
  expect(await take('callback')).toBeUndefined()
  expect(listener).not.toHaveBeenCalled()
})

test('retains a snapshot rather than a mutable provider object', async () => {
  const { publish, take } = await fixture()
  const data = { token: 'original-token' }
  await publish('callback', data)
  data.token = 'changed-token'
  expect(await take('callback')).toEqual({ token: 'original-token' })
})
