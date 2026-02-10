import { z } from 'zod'
import { ProviderOptionsSchema, ServerConfigSchema } from './common.ts'

// Keep these schemas tolerant initially: they are for inference + narrowing,
// not for changing runtime behavior.

export const StandaloneCompanionOptionsSchema = z
  .object({
    server: ServerConfigSchema.optional(),
    providerOptions: ProviderOptionsSchema.optional(),
    s3: z.record(z.unknown()).optional(),
    secret: z.string().optional(),
    preAuthSecret: z.string().optional(),
    filePath: z.string().optional(),
    uploadUrls: z.array(z.string()).nullable().optional(),
    corsOrigins: z.unknown().optional(),
    redisUrl: z.string().optional(),
    redisOptions: z.unknown().optional(),
    redisPubSubScope: z.string().optional(),
    periodicPingUrls: z.array(z.string()).optional(),
    metrics: z.boolean().optional(),
    loggerProcessName: z.string().optional(),
  })
  .passthrough()

export type StandaloneCompanionOptionsInput = z.input<
  typeof StandaloneCompanionOptionsSchema
>
export type StandaloneCompanionOptions = z.output<
  typeof StandaloneCompanionOptionsSchema
>
