// Adds `slug: '{filename-without-extension}'` to all blog posts in /blog

import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import globby from 'globby'

const paths = await globby('./blog/*.md')

for (const path in paths) {
  const file = await readFile(paths[path], { encoding: 'utf-8' })

  const slug = basename(paths[path], '.md').replace(/-/g, '/')
  console.log(slug)

  const fileWithSlug = file.replace(/\n---/, `\nslug: "${slug}"\n---`)
  console.log(fileWithSlug)
  await writeFile(paths[path], fileWithSlug, { encoding: 'utf-8' })
}

// console.log(paths)
