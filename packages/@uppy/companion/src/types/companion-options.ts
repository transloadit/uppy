import type { defaultOptions } from '../config/companion.ts'
import type { CompanionInitOptions } from '../schemas/companion.ts'

type DefaultOptions = typeof defaultOptions

// Runtime Companion options are the merged default options + init options.

export type CompanionRuntimeOptions = DefaultOptions & CompanionInitOptions
