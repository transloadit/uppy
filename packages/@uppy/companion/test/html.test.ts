import { expect, test } from 'vitest'
import { legacyAuthCallbackHtml } from '../dist/server/helpers/html.js'

test('data and origin cannot break out of the inline script', () => {
  const html = legacyAuthCallbackHtml(
    { token: '</script><script>alert(1)</script><!--' },
    'http://localhost:3020\u2028\u2029',
  )

  expect(html).not.toContain('</script><script>')
  expect(html).not.toContain('<!--')
  expect(html).toContain(
    'var data = {"token":"\\u003C\\u002Fscript\\u003E\\u003Cscript\\u003Ealert(1)\\u003C\\u002Fscript\\u003E\\u003C!--"};',
  )
  expect(html).toContain(
    'var origin = "http:\\u002F\\u002Flocalhost:3020\\u2028\\u2029";',
  )
})

test('an undefined origin stays undefined', () => {
  expect(legacyAuthCallbackHtml({ error: true }, undefined)).toContain(
    'var origin = undefined;',
  )
})
