import type { CompanionInitOptions } from '../schemas/companion.ts'

type WidenLiteral<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T

type DeepWiden<T> = T extends readonly (infer U)[]
  ? readonly DeepWiden<U>[]
  : T extends object
    ? { [K in keyof T]: DeepWiden<WidenLiteral<T[K]>> }
    : WidenLiteral<T>

type DefaultOptions = typeof import('../config/companion.ts').defaultOptions

// Runtime Companion options are the merged default options + init options.
// This type is intentionally tolerant, but gives known defaulted keys concrete types.
export type CompanionRuntimeOptions = DeepWiden<DefaultOptions> &
  CompanionInitOptions
