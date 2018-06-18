const chalk = require('chalk')
const babel = require('babel-core')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const mkdirp = promisify(require('mkdirp'))
const fs = require('fs')
const path = require('path')

const transformFile = promisify(babel.transformFile)
const writeFile = promisify(fs.writeFile)

const SOURCE = 'packages/{*,@uppy/*}/src/**/*.js'
// Files not to build (such as tests)
const IGNORE = /\.test\.js$|__mocks__/

async function buildLib () {
  const files = await glob(SOURCE)
  for (const file of files) {
    if (IGNORE.test(file)) continue

    const libFile = file.replace('/src/', '/lib/')
    const { code, map } = await transformFile(file, {})
    await mkdirp(path.dirname(libFile))
    await Promise.all([
      writeFile(libFile, code),
      writeFile(libFile + '.map', JSON.stringify(map))
    ])
    console.log(chalk.green('Compiled lib:'), chalk.magenta(libFile))
  }
}

buildLib().catch((err) => {
  console.error(err.stack)
  process.exit(1)
})
