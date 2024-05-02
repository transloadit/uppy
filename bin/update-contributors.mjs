#!/usr/bin/env node

import fetchContrib from 'github-contributors-list/lib/contributors.js'
import layoutStrategy from 'github-contributors-list/lib/strategies/layout_strategies/json.js'
import sortStrategy from 'github-contributors-list/lib/strategies/sort_strategies/sort_desc.js'
import filterStrategy from 'github-contributors-list/lib/strategies/filter_strategies/login.js'
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import process from 'node:process'

const README_FILE_NAME = new URL('../README.md', import.meta.url)

const readme = await fs.open(README_FILE_NAME, 'r+')
const readmeContent = await readme.readFile()

// Detect start of contributors section.
const START_TAG = Buffer.from('<table id="contributors_table">\n')
const START_TAG_POSITION =
  readmeContent.indexOf(START_TAG) + START_TAG.byteLength

const args = {
  owner: 'transloadit',
  repository: 'uppy',
  cols: 6,
  format: 'json',
  sortBy: 'contributions',
  sortOrder: 'desc',
  filter: [],
  layoutStrategy,
  sortStrategy,
  filterStrategy,
}
const { contributors } = await fetchContrib(args).loadAll(
  args.owner,
  args.repository,
  args.authToken || process.env.GITHUB_API_TOKEN,
  args.fromDate,
)
let cursor = START_TAG_POSITION
for (const line of contributors) {
  let row = '<tr>'
  for (const { html_url, login, avatar_url } of line) {
    row += `<td><a href=${html_url}><img width="117" alt=${JSON.stringify(login)} src=${JSON.stringify(avatar_url)}></a></td>`
  }
  row += '</tr>\n'
  const { bytesWritten } = await readme.write(row, cursor, 'utf-8')
  cursor += bytesWritten
}

if (cursor === START_TAG_POSITION) {
  console.log('Empty response from githubcontrib. GitHub’s rate limit?')
  await readme.close()
  process.exit(1)
}

await readme.truncate(cursor)

// Write the end of the file.
await readme.write(
  readmeContent,
  readmeContent.indexOf('<!--/contributors-->'),
  undefined,
  cursor,
)
await readme.close()
