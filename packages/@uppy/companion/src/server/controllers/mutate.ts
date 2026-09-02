import type { NextFunction, Request, Response } from 'express'
import { isRecord } from '../helpers/type-guards.js'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'

type MutationContext = {
  provider: NonNullable<Request['companion']['provider']>
  providerUserSession: Request['companion']['providerUserSession']
  companion: Request['companion']
}

type ParsedInput<I> = { ok: true; input: I } | { ok: false; message: string }

const readString = (body: unknown, key: string): string | null => {
  if (!isRecord(body)) return null
  const value = body[key]
  return typeof value === 'string' ? value : null
}

/**
 * Builds an Express handler for one provider mutation: checks that the
 * provider supports mutations, validates the body, runs the mutation and maps
 * provider errors to HTTP responses.
 */
function mutation<I>(
  name: string,
  parse: (body: unknown) => ParsedInput<I>,
  run: (ctx: MutationContext, input: I) => Promise<unknown>,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { provider, providerClass, providerUserSession } = req.companion
    if (!provider || !providerClass) {
      res.sendStatus(400)
      return
    }
    if (!providerClass.supportsMutations) {
      res
        .status(400)
        .json({ message: 'This provider does not support mutations' })
      return
    }
    const parsed = parse(req.body)
    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }
    try {
      res.json(
        await run(
          { provider, providerUserSession, companion: req.companion },
          parsed.input,
        ),
      )
    } catch (err) {
      logger.error(err, `controller.mutate.${name}.error`, req.id)
      if (respondWithError(err, res)) return
      next(err)
    }
  }
}

export const deleteItem = mutation(
  'delete',
  (body) => {
    const id = readString(body, 'id')
    return !id
      ? { ok: false, message: 'Missing id' }
      : { ok: true, input: { id } }
  },
  async ({ provider, providerUserSession, companion }, { id }) => {
    await provider.deleteItem({ companion, id, providerUserSession })
    return { ok: true }
  },
)

export const moveItem = mutation(
  'move',
  (body) => {
    const id = readString(body, 'id')
    const destination = readString(body, 'destination')
    return !id || !destination
      ? { ok: false, message: 'Missing id or destination' }
      : { ok: true, input: { id, destination } }
  },
  ({ provider, providerUserSession, companion }, { id, destination }) =>
    provider.moveItem({ companion, id, destination, providerUserSession }),
)

export const createFolder = mutation(
  'createFolder',
  (body) => {
    const name = readString(body, 'name')
    const parentId = readString(body, 'parentId')
    return !name
      ? { ok: false, message: 'Missing name' }
      : { ok: true, input: { name, parentId: parentId || null } }
  },
  ({ provider, providerUserSession, companion }, { name, parentId }) =>
    provider.createFolder({ companion, parentId, name, providerUserSession }),
)
