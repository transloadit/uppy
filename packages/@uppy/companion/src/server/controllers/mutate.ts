import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import type { CompanionContext } from '../../types/express.js'
import { respondWithError } from '../provider/error.js'
import type Provider from '../provider/Provider.js'

/** Present and non-empty; not trimmed, like the wire format the client sends. */
const requiredString = z.string().min(1)
/** Missing, null or empty mean "the root folder"; anything else must be a string. */
const parentIdField = z
  .string()
  .nullish()
  .transform((value) => value || null)

/**
 * Builds a handler for one provider mutation: validates the body, runs the
 * mutation and maps provider errors to HTTP responses. That a provider is
 * attached and supports mutations is guaranteed by the middleware chain
 * (`hasSessionAndProvider`, `hasMutationProvider`); provider errors are turned
 * into responses by `respondWithError`, and logged by the provider itself.
 */
function mutation<S extends z.ZodType>(
  schema: S,
  run: (
    provider: Provider,
    companion: CompanionContext,
    input: z.infer<S>,
  ) => Promise<unknown>,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { provider } = req.companion
    if (!provider) {
      res.sendStatus(400)
      return
    }
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request body' })
      return
    }
    try {
      res.json(await run(provider, req.companion, parsed.data))
    } catch (err) {
      if (respondWithError(err, res)) return
      next(err)
    }
  }
}

const operations = {
  delete: mutation(
    z.object({ id: requiredString }),
    async (provider, companion, { id }) => {
      await provider.deleteItem({
        companion,
        id,
        providerUserSession: companion.providerUserSession,
      })
      return { ok: true }
    },
  ),
  move: mutation(
    z.object({ id: requiredString, destination: requiredString }),
    (provider, companion, { id, destination }) =>
      provider.moveItem({
        companion,
        id,
        destination,
        providerUserSession: companion.providerUserSession,
      }),
  ),
  'create-folder': mutation(
    z.object({ name: requiredString, parentId: parentIdField }),
    (provider, companion, { name, parentId }) =>
      provider.createFolder({
        companion,
        parentId,
        name,
        providerUserSession: companion.providerUserSession,
      }),
  ),
}

/** Dispatches `/:providerName/mutate/:operation` to the matching mutation. */
export default function mutate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const operation = req.params['operation']
  const handler =
    typeof operation === 'string' && Object.hasOwn(operations, operation)
      ? operations[operation as keyof typeof operations]
      : undefined
  if (handler == null) {
    res.sendStatus(404)
    return
  }
  void handler(req, res, next)
}
