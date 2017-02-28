const path = require('path')
const chalk = require('chalk')
const mkdirp = require('mkdirp')
const glob = require('glob')
const yoyoify = require('yo-yoify-standalone')

const DIST_DIR = 'lib.yoyoified'
const SRC_DIR = 'src'

const DOC_PATTERN = '**/*.js'

const fileList = glob.sync(SRC_DIR + '/' + DOC_PATTERN)

fileList.forEach((srcPath) => {
  const distPath = srcPath.replace(SRC_DIR, DIST_DIR)

  mkdirp.sync(path.dirname(distPath))

  yoyoify(srcPath, distPath)

  console.info(chalk.green('✓ Yo-yoified:'), srcPath, '-->', chalk.magenta(distPath))

  // const parseCommand = `cat ${srcPath} | ./yo-yoify-cli.js | babel --out-file ${distPath}`
  // execSync(parseCommand)
})
