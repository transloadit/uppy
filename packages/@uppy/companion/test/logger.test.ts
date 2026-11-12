import { beforeAll, describe, expect, test } from 'vitest'

// We don't care about colors in our tests, so force `util.styleText` to disable colors.
process.env['FORCE_COLOR'] = 'false'

import logger, { MAX_LOG_MESSAGE_LENGTH } from '../dist/server/logger.js'

const maskables = ['ToBeMasked1', 'toBeMasked2', 'toBeMasked(And)?Escaped']

function captureConsoleLog(log: () => void): string {
  let loggedMessage: string | null = null

  // override the default console.log to capture the logged message
  const defaultConsoleLog = console.log

  try {
    console.log = (logPrefix: unknown, message: unknown) => {
      loggedMessage = String(message)
      defaultConsoleLog(logPrefix, message)
    }
  } finally {
    log()
    // restore the default console.log before using "expect" to avoid weird log behaviors
    console.log = defaultConsoleLog
  }
  if (loggedMessage == null) {
    throw new Error('Expected logger to write a console message')
  }
  return loggedMessage
}

describe('Test Logger secret mask', () => {
  beforeAll(() => {
    logger.setMaskables(maskables)
  })

  test('masks secret values present in log.info messages', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.info(
        'this info has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2',
      )
    })

    const exptectedMsg =
      'this info has ****** and ****** and case-insensitive ******'

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks secret values present in log.warn messages', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.warn(
        'this warning has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2',
      )
    })

    const exptectedMsg =
      'this warning has ****** and ****** and case-insensitive ******'

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks secret values present in log.error messages', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.error(
        new Error(
          'this error has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2',
        ),
      )
    })

    const exptectedMsg =
      'Error: this error has ****** and ****** and case-insensitive ******'

    expect(loggedMessage.startsWith(exptectedMsg)).toBeTruthy()
  })

  test('masks secret values present in log.error stack trace', () => {
    const loggedMessage = captureConsoleLog(() => {
      const err = new Error(
        'this error has ToBeMasked1 and toBeMasked2 and case-insensitive TOBEMasKED2',
      )
      logger.error(err, '', '')
    })

    const exptectedMsg =
      'Error: this error has ****** and ****** and case-insensitive ******'

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage.startsWith(exptectedMsg)).toBe(true)
    expect(loggedMessage.includes('ToBeMasked1')).toBe(false)
    expect(loggedMessage.includes('toBeMasked2')).toBe(false)
    expect(loggedMessage.includes('TOBEMasKED2')).toBe(false)
  })

  test('escape regex characters from secret values before masking them', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.warn(
        'this warning has ToBeMasked(And)?Escaped but not toBeMaskedEscaped ',
      )
    })

    const exptectedMsg = 'this warning has ****** but not toBeMaskedEscaped '

    expect(loggedMessage).toBeTruthy()
    expect(loggedMessage).toBe(exptectedMsg)
  })

  test('masks inside object', () => {
    const loggedMessage = captureConsoleLog(() => {
      logger.warn({
        a: 1,
        deep: { secret: 'there is a ToBeMasked1 hiding here' },
      })
    })

    expect(loggedMessage).toBeTruthy()
    expect(
      !maskables.some((maskable) => loggedMessage.includes(maskable)),
    ).toBeTruthy()
  })
})

describe('log message bounds and error formatting', () => {
  test('caps a log line at MAX_LOG_MESSAGE_LENGTH', () => {
    const msg = captureConsoleLog(() => {
      logger.error(new Error('x'.repeat(50_000)))
    })
    expect(msg.length).toBeLessThan(MAX_LOG_MESSAGE_LENGTH + 40)
    expect(msg).toMatch(/\[truncated \d+ chars\]$/)
  })

  test('does not print an error request options', () => {
    const err = Object.assign(new Error('boom'), {
      options: { headers: { authorization: 'Bearer SUPERSECRET' } },
      code: 'ERR_X',
    })
    const msg = captureConsoleLog(() => {
      logger.error(err, '', '')
    })
    expect(msg).not.toContain('SUPERSECRET')
    expect(msg).toContain('ERR_X')
    expect(msg).toContain('Error: boom')
  })

  test('keeps the cause chain', () => {
    const msg = captureConsoleLog(() => {
      logger.error(new Error('outer', { cause: new Error('inner') }))
    })
    expect(msg).toContain('[cause]')
    expect(msg).toContain('Error: inner')
  })
})
