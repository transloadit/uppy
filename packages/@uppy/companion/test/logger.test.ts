import { beforeAll, describe, expect, test, vi } from 'vitest'

// We don't care about colors in our tests, so force `util.styleText` to disable colors.
process.env['FORCE_COLOR'] = 'false'

import logger, { MAX_LOG_MESSAGE_LENGTH } from '../dist/server/logger.js'

const maskables = ['ToBeMasked1', 'toBeMasked2', 'toBeMasked(And)?Escaped']

/** The logged message; a multi-line one is logged one line per record. */
function captureConsoleLog(log: () => void): string {
  const lines: string[] = []

  // override the default console.log to capture the logged message
  const defaultConsoleLog = console.log

  try {
    console.log = (logPrefix: unknown, message: unknown) => {
      lines.push(String(message))
      defaultConsoleLog(logPrefix, message)
    }
  } finally {
    log()
    // restore the default console.log before using "expect" to avoid weird log behaviors
    console.log = defaultConsoleLog
  }
  if (lines.length === 0) {
    throw new Error('Expected logger to write a console message')
  }
  return lines.join('\n')
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
  /** The [prefix, message] pairs that one log call prints, one per line. */
  function captureRecords(log: () => void): Array<[string, string]> {
    using logged = vi.spyOn(console, 'log').mockImplementation(() => {})
    log()
    return logged.mock.calls.map(([prefix, message]) => [
      String(prefix),
      String(message),
    ])
  }

  test('logs each line of a message as its own record, with the prefix', () => {
    const records = captureRecords(() => {
      logger.info('é\nsecond\r\nthird\u2028fourth', 'tag', 'id')
    })
    expect(records.map(([, message]) => message)).toEqual([
      'é',
      'second',
      'third',
      'fourth',
    ])
    for (const [prefix] of records) expect(prefix).toContain('id tag')
  })

  test('keeps tabs, and escapes other terminal controls, colour codes too', () => {
    const [record] = captureRecords(() => {
      logger.info('a\tb \u001b[8mhidden \u001b]52;c;eA==\u0007 \u009b \u0000')
    })
    expect(record?.[1]).toBe(
      'a\tb \\u001b[8mhidden \\u001b]52;c;eA==\\u0007 \\u009b \\u0000',
    )
  })

  test('caps the records one message takes', () => {
    const records = captureRecords(() => {
      logger.info('\n'.repeat(1000))
    })
    expect(records).toHaveLength(201)
    expect(records.at(-1)?.[1]).toBe('… [801 more lines]')
  })

  test('masks a secret split by a carriage return', () => {
    logger.setMaskables(maskables)
    const message = captureConsoleLog(() => {
      logger.info('ToBe\rMasked1')
    })
    expect(message).not.toContain('ToBeMasked1')
  })

  test('escapes controls and line breaks in the tag and request id', () => {
    const records = captureRecords(() => {
      logger.info('message', 'tag\nnext', 'id\u0007')
    })
    expect(records).toHaveLength(1)
    expect(records[0]?.[0]).toContain('id\\u0007 tag\\u000anext')
  })

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
