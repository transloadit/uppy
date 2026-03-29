import type { defaultOptions } from '../config/companion.js'
import type { CompanionInitOptions } from '../schemas/companion.js'

type DefaultOptions = typeof defaultOptions

// Runtime Companion options are the merged default options + init options.

export type CompanionRuntimeOptions = DefaultOptions & CompanionInitOptions
