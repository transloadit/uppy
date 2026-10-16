import { expect, test } from 'vitest'
import { getNextPagePath } from '../src/server/helpers/utils.js'

test('getNextPagePath keeps the path and query and sets the cursor', () => {
  expect(getNextPagePath('', {}, 20)).toBe('?cursor=20')
  expect(getNextPagePath('folder', { q: 'a b', cursor: 'old' }, 'next')).toBe(
    'folder?q=a%20b&cursor=next',
  )
})
