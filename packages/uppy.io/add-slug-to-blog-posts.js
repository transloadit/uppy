// Adds `slug: '{filename-without-extension}'` to all blog posts in /blog

import globby from 'globby';
import { basename } from 'path';
import { readFile, writeFile } from 'node:fs/promises';

const paths = await globby('./blog/*.md');

for (const path in paths) {
	const file = await readFile(paths[path], { encoding: 'utf-8' });

	let slug = basename(paths[path], '.md').replace(/-/g, '/');
	console.log(slug);

	const fileWithSlug = file.replace(/\n---/, `\nslug: "${slug}"\n---`);
	console.log(fileWithSlug);
	await writeFile(paths[path], fileWithSlug, { encoding: 'utf-8' });
}

// console.log(paths)
