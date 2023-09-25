import { vi } from 'vitest' // eslint-disable-line import/no-extraneous-dependencies
import { webcrypto } from 'node:crypto'

vi.stubGlobal('crypto', webcrypto)
