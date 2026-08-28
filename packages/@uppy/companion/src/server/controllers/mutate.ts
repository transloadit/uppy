import type { NextFunction, Request, Response } from 'express'
import { isRecord } from '../helpers/type-guards.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'

const readString = (body: unknown, key: string): string | null => {
  if (!isRecord(body)) return null
  const value = body[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

const readNullableString = (body: unknown, key: string): string | null => {
  if (!isRecord(body)) return null
  const value = body[key]
  return typeof value === 'string' ? value : null
}

function requireMutationProvider(req: Request, res: Response) {
  const { provider, providerClass, providerUserSession, options } =
    req.companion
  if (!provider || !providerClass) {
    res.sendStatus(400)
    return null
  }
  if (!providerClass.supportsMutations) {
    res
      .status(400)
      .json({ message: 'This provider does not support mutations' })
    return null
  }
  return { provider, providerUserSession, companion: req.companion }
}

export async function deleteItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ctx = requireMutationProvider(req, res)
  if (!ctx) return
  const id = readString(req.body, 'id')
  if (id === null) {
    res.status(400).json({ message: 'Missing id' })
    return
  }
  try {
    await ctx.provider.deleteItem({
      companion: ctx.companion,
      id,
      providerUserSession: ctx.providerUserSession,
    })
    res.json({ ok: true })
  } catch (err) {
    logger.error(err, 'controller.mutate.delete.error', req.id)
    if (respondWithError(err, res)) return
    next(err)
  }
}

export async function moveItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ctx = requireMutationProvider(req, res)
  if (!ctx) return
  const id = readString(req.body, 'id')
  const destination = readString(req.body, 'destination')
  if (id === null || destination === null) {
    res.status(400).json({ message: 'Missing id or destination' })
    return
  }
  try {
    const result = await ctx.provider.moveItem({
      companion: ctx.companion,
      id,
      destination,
      providerUserSession: ctx.providerUserSession,
    })
    res.json(result)
  } catch (err) {
    logger.error(err, 'controller.mutate.move.error', req.id)
    if (respondWithError(err, res)) return
    next(err)
  }
}

export async function createFolder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ctx = requireMutationProvider(req, res)
  if (!ctx) return
  const name = readString(req.body, 'name')
  const parentId = readNullableString(req.body, 'parentId')
  if (name === null) {
    res.status(400).json({ message: 'Missing name' })
    return
  }
  try {
    const result = await ctx.provider.createFolder({
      companion: ctx.companion,
      parentId: parentId || null,
      name,
      providerUserSession: ctx.providerUserSession,
    })
    res.json(result)
  } catch (err) {
    logger.error(err, 'controller.mutate.createFolder.error', req.id)
    if (respondWithError(err, res)) return
    next(err)
  }
}
