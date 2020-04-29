/* global test:false, expect:false, describe:false, beforeAll:false, */
const logger = require('../../src/server/logger')
const chalk = require('chalk')

describe('Test Logger secret mask', () => {
  beforeAll(() => {
    logger.setMaskables(['ToBeMasked1', 'toBeMasked2', 'toBeMasked(And)?Escaped'])
  })

  test('masks secret values present in log.info messages', () => {
    let loggedMessage = null

    // override the default console.log to capture the logged message
    const defaultConsoleLog = console.log
    console.log = (logPrefix, message) => {
      loggedMessage = message
      defaultConsoleLog(logPrefix, message)
    }

    logger.info('this info has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2')
    // restore the default console.log before using "expect" to avoid weird log behaviors
    console.log = defaultConsoleLog

    const exptectedMsg = 'this info has ****** and ****** and case-insensitive ******'

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks secret values present in log.warn messages', () => {
    let loggedMessage = null

    // override the default console.log to capture the logged message
    const defaultConsoleLog = console.log
    console.log = (logPrefix, message) => {
      loggedMessage = message
      defaultConsoleLog(logPrefix, message)
    }

    logger.warn('this warning has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2')
    // restore the default console.log before using "expect" to avoid weird log behaviors
    console.log = defaultConsoleLog

    const exptectedMsg = chalk.bold.yellow('this warning has ****** and ****** and case-insensitive ******')

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks secret values present in log.error messages', () => {
    let loggedMessage = null

    // override the default console.log to capture the logged message
    const defaultConsoleLog = console.log
    console.log = (logPrefix, message) => {
      loggedMessage = message
      defaultConsoleLog(logPrefix, message)
    }

    logger.error(new Error('this error has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2'))
    // restore the default console.log before using "expect" to avoid weird log behaviors
    console.log = defaultConsoleLog

    const exptectedMsg = chalk.bold.red('Error: this error has ****** and ****** and case-insensitive ******')

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks secret values present in log.error stack trace', () => {
    let loggedMessage = null

    // override the default console.log to capture the logged message
    const defaultConsoleLog = console.log
    console.log = (logPrefix, message) => {
      loggedMessage = message
      defaultConsoleLog(logPrefix, message)
    }

    const err = new Error('this error has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2')
    logger.error(err, '', '', true)
    // restore the default console.log before using "expect" to avoid weird log behaviors
    console.log = defaultConsoleLog

    const exptectedMsg = chalk.bold.red('Error: this error has ****** and ****** and case-insensitive ******')

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage.startsWith(exptectedMsg)).toBe(true)
    expect(loggedMessage.includes('ToBeMasked1')).toBe(false)
    expect(loggedMessage.includes('toBeMasked2')).toBe(false)
    expect(loggedMessage.includes('TOBEMasKED2')).toBe(false)
  })

  test('escape regex characters from secret values before masking them', () => {
    let loggedMessage = null

    // override the default console.log to capture the logged message
    const defaultConsoleLog = console.log
    console.log = (logPrefix, message) => {
      loggedMessage = message
      defaultConsoleLog(logPrefix, message)
    }

    logger.warn('this warning has ToBeMasked(And)?Escaped but not toBeMaskedEscaped ')
    // restore the default console.log before using "expect" to avoid weird log behaviors
    console.log = defaultConsoleLog

    const exptectedMsg = chalk.bold.yellow('this warning has ****** but not toBeMaskedEscaped ')

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })
})
