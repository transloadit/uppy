import { webcrypto } from 'node:crypto'
import { vi } from 'vitest' // eslint-disable-line import/no-extraneous-dependencies

vi.stubGlobal('crypto', webcrypto)
