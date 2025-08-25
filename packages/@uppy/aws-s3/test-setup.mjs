import { webcrypto } from 'node:crypto'
import { vi } from 'vitest'

vi.stubGlobal('crypto', webcrypto)
