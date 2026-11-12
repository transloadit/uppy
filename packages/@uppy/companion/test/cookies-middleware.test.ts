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
