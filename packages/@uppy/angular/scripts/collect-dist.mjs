// ng-packagr writes to dist/, but this package publishes fesm2022/ and types/
// from its root (see "main", "types" and "files" in package.json), so its
// output has to be moved up after every build.
//
// The directories are emptied rather than removed: `turbo watch` holds
// filesystem watches on them as declared task outputs, and deleting a watched
// directory takes the watcher's notify backend down with it, which kills the
// whole `turbo watch` session mid-wave.
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

for (const dir of ['fesm2022', 'types']) {
  mkdirSync(dir, { recursive: true })
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true })
  }
  cpSync(join('dist', dir), dir, { recursive: true })
  rmSync(join('dist', dir), { recursive: true, force: true })
}
