import type { Request, Response } from 'express'
import { expect, test, vi } from 'vitest'
import { cookies } from '../dist/server/middlewares.js'

const run = (req: object) => {
  const next = vi.fn()
  cookies(req as Request, {} as Response, next)
  expect(next).toHaveBeenCalledOnce()
  return (req as Request).cookies
}

test('keeps the cookie map of an app embedding Companion', () => {
  const existing = { prefs: { theme: 'dark' } }

  expect(run({ cookies: existing, headers: { cookie: 'prefs=raw' } })).toBe(
    existing,
  )
})

test('parses the Cookie header when there is no map yet', () => {
  expect(run({ headers: { cookie: 'a=1; b=x%20y' } })).toEqual({
    a: '1',
    b: 'x y',
  })
})

test('sets an empty map when there is no Cookie header', () => {
  expect(run({ headers: {} })).toEqual({})
})

test('leaves JSON cookie values as strings', () => {
  expect(run({ headers: { cookie: 'a=j%3A%7B%22b%22%3A1%7D' } })).toEqual({
    a: 'j:{"b":1}',
  })
})

test('parses a long run of whitespace in linear time', () => {
  const start = performance.now()
  run({ headers: { cookie: `a=b${' '.repeat(16_000)}c` } })
  expect(performance.now() - start).toBeLessThan(50)
})
