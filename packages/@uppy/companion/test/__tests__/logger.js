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

  test('masks secret values present in log.warn messages', () => {
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
