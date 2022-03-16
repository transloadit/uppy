/* global test:false, expect:false, describe:false, beforeAll:false, */
const chalk = require('chalk')
const logger = require('../../src/server/logger')

const maskables = ['ToBeMasked1', 'toBeMasked2', 'toBeMasked(And)?Escaped']

function captureConsoleLog (log) {
  let loggedMessage = null

  // override the default console.log to capture the logged message
  const defaultConsoleLog = console.log

  try {
    console.log = (logPrefix, message) => {
      loggedMessage = message
      defaultConsoleLog(logPrefix, message)
    }
  } finally {
    log()
    // restore the default console.log before using "expect" to avoid weird log behaviors
    console.log = defaultConsoleLog
  }
  return loggedMessage
}

describe('Test Logger secret mask', () => {
  beforeAll(() => {
    logger.setMaskables(maskables)
  })

  test('masks secret values present in log.info messages', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.info('this info has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2')
    })

    const exptectedMsg = 'this info has ****** and ****** and case-insensitive ******'

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks secret values present in log.warn messages', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.warn('this warning has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2')
    })

    const exptectedMsg = chalk.bold.yellow('this warning has ****** and ****** and case-insensitive ******')

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks secret values present in log.error messages', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.error(new Error('this error has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2'))
    })

    const exptectedMsg = chalk.bold.red('Error: this error has ****** and ****** and case-insensitive ******')

    expect(loggedMessage.startsWith(exptectedMsg)).toBeTruthy()
  })

  test('masks secret values present in log.error stack trace', () => {
    const loggedMessage = captureConsoleLog(() => {
      const err = new Error('this error has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2')
      logger.error(err, '', '')
    })

    const exptectedMsg = chalk.bold.red('Error: this error has ****** and ****** and case-insensitive ******')

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage.startsWith(exptectedMsg)).toBe(true)
    expect(loggedMessage.includes('ToBeMasked1')).toBe(false)
    expect(loggedMessage.includes('toBeMasked2')).toBe(false)
    expect(loggedMessage.includes('TOBEMasKED2')).toBe(false)
  })

  test('escape regex characters from secret values before masking them', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.warn('this warning has ToBeMasked(And)?Escaped but not toBeMaskedEscaped ')
    })

    const exptectedMsg = chalk.bold.yellow('this warning has ****** but not toBeMaskedEscaped ')

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks inside object', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.warn({ a: 1, deep: { secret: 'there is a ToBeMasked1 hiding here' } })
    })

    expect(loggedMessage).toBeTruthy()
    expect(!maskables.some((maskable) => loggedMessage.includes(maskable))).toBeTruthy()
  })
})
