export interface ServerConfig {
  protocol?: string | undefined
  host?: string | undefined
  path?: string | undefined
  implicitPath?: string | undefined
  oauthDomain?: string | undefined
  validHosts?: string[] | undefined
}

export interface ProviderOption {
  key?: string | undefined
  secret?: string | undefined
  credentialsURL?: string | undefined
  verificationToken?: string | undefined
}

export type ProviderOptions = Record<string, ProviderOption>
