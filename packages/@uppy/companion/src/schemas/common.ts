import { z } from 'zod'

export const ServerConfigSchema = z
  .object({
    protocol: z.string().optional(),
    host: z.string().optional(),
    path: z.string().optional(),
    implicitPath: z.string().optional(),
    oauthDomain: z.string().optional(),
    validHosts: z.array(z.string()).optional(),
  })
  .passthrough()

export const ProviderOptionSchema = z
  .object({
    key: z.string().optional(),
    secret: z.string().optional(),
    credentialsURL: z.string().optional(),
  })
  .passthrough()

export const ProviderOptionsSchema = z.record(ProviderOptionSchema)

export type ServerConfig = z.output<typeof ServerConfigSchema>
export type ProviderOption = z.output<typeof ProviderOptionSchema>
export type ProviderOptions = z.output<typeof ProviderOptionsSchema>

