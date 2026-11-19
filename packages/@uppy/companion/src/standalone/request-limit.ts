import type { Socket } from 'node:net'
import type { RequestHandler } from 'express'

/** Bound requests retained while a pipelined connection waits on upstream I/O. */
export function limitPendingRequests(maxPending = 100): RequestHandler {
  const pending = new WeakMap<Socket, number>()
  return (req, res, next) => {
    const count = pending.get(req.socket) ?? 0
    if (count >= maxPending) {
      res.setHeader('Connection', 'close')
      res.status(429).json({ message: 'Too many pending requests' })
      return
    }
    pending.set(req.socket, count + 1)
    const release = () => {
      res.off('finish', release)
      res.off('close', release)
      pending.set(req.socket, (pending.get(req.socket) ?? 1) - 1)
    }
    res.once('finish', release)
    res.once('close', release)
    next()
  }
}
