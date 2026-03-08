import type { CompanionInitOptions } from './companion.ts'

export type StandaloneCompanionOptions = Pick<
  CompanionInitOptions,
  | 'server'
  | 'providerOptions'
  | 'secret'
  | 'preAuthSecret'
  | 'filePath'
  | 'redisUrl'
  | 'redisOptions'
  | 'redisPubSubScope'
  | 'periodicPingUrls'
  | 'metrics'
  | 'loggerProcessName'
  | 'uploadUrls'
>
