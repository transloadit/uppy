import { z } from 'zod'

/** Present and non-empty; not trimmed, like the wire format the client sends. */
export const requiredString = z.string().min(1)
