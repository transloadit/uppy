import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import logger from '../logger.js'
import { respondWithError } from '../provider/error.js'

type MutationContext = {
  provider: NonNullable<Request['companion']['provider']>
  providerUserSession: Request['companion']['providerUserSession']
  companion: Request['companion']
}

/** Present and non-empty; not trimmed, like the wire format the client sends. */
const requiredString = z.string().min(1)
/** Missing, null, non-string or empty all mean "the root folder". */
const parentIdField = z
  .string()
  .catch('')
  .transform((value) => value || null)

/**
 * Builds an Express handler for one provider mutation: checks that the
 * provider supports mutations, validates the body, runs the mutation and maps
 * provider errors to HTTP responses. `invalid` is the message for a body that
 * does not match `schema`; provider errors are mapped by `respondWithError`.
 */
function mutation<S extends z.ZodType>(
  name: string,
  schema: S,
  invalid: string,
  run: (ctx: MutationContext, input: z.infer<S>) => Promise<unknown>,
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
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: invalid })
      return
    }
    try {
      res.json(
        await run(
          { provider, providerUserSession, companion: req.companion },
          parsed.data,
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
  z.object({ id: requiredString }),
  'Missing id',
  async ({ provider, providerUserSession, companion }, { id }) => {
    await provider.deleteItem({ companion, id, providerUserSession })
    return { ok: true }
  },
)

export const moveItem = mutation(
  'move',
  z.object({ id: requiredString, destination: requiredString }),
  'Missing id or destination',
  ({ provider, providerUserSession, companion }, { id, destination }) =>
    provider.moveItem({ companion, id, destination, providerUserSession }),
)

export const createFolder = mutation(
  'createFolder',
  z.object({ name: requiredString, parentId: parentIdField }),
  'Missing name',
  ({ provider, providerUserSession, companion }, { name, parentId }) =>
    provider.createFolder({ companion, parentId, name, providerUserSession }),
)
