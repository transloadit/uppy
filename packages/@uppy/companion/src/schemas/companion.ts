import { z } from 'zod'
import type { RedisOptions } from 'ioredis'
import type Provider from '../server/provider/Provider.ts'
import { ProviderOptionsSchema, ServerConfigSchema } from './common.ts'

// Tolerant schema for Companion's initialization options. This is primarily for
// type inference and safe narrowing, not for rejecting config at runtime.

type ProviderConstructor = typeof Provider

const ProviderConstructorSchema = z.custom<ProviderConstructor>(
  (value) => typeof value === 'function',
)

const CustomProviderSchema = z.object({
  // Runtime shape is validated elsewhere; this is primarily for type inference.
  module: ProviderConstructorSchema,
  config: z.record(z.unknown()),
})

export const CompanionInitOptionsSchema = z
  .object({
    secret: z.string().optional(),
    preAuthSecret: z.string().optional(),
    loggerProcessName: z.string().optional(),
    server: ServerConfigSchema.optional(),
    providerOptions: ProviderOptionsSchema.optional(),
    customProviders: z.record(CustomProviderSchema).optional(),
    s3: z.record(z.unknown()).optional(),
    redisUrl: z.string().optional(),
    redisOptions: z
      .custom<RedisOptions>(
        (value) =>
          !!value &&
          typeof value === 'object' &&
          !Array.isArray(value),
      )
      .optional(),
    redisPubSubScope: z.string().optional(),
    sendSelfEndpoint: z.string().optional(),
    enableUrlEndpoint: z.boolean().optional(),
    enableGooglePickerEndpoint: z.boolean().optional(),
    metrics: z.boolean().optional(),

    // Used internally by Companion:
    filePath: z.string().optional(),
    periodicPingUrls: z.array(z.string()).optional(),
    periodicPingInterval: z.number().optional(),
    periodicPingCount: z.number().optional(),
    periodicPingStaticPayload: z.unknown().optional(),
    testDynamicOauthCredentials: z.boolean().optional(),
    testDynamicOauthCredentialsSecret: z.string().optional(),
  })
  .passthrough()

export type CompanionInitOptionsInput = z.input<
  typeof CompanionInitOptionsSchema
>
export type CompanionInitOptions = z.output<typeof CompanionInitOptionsSchema>
