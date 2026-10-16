const fs = require('node:fs/promises');
const path = require('node:path');

const DOCS_DIR = 'docs';
const ROUTE_BASE = '/docs';

// Limitation: this is a hand-rolled scalar-only frontmatter reader. We only read
// `title`, `description` and `slug`, as inline or continued plain strings. Swap
// in `gray-matter` if a doc ever needs nested or structured frontmatter.
function splitFrontmatter(raw) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return { data: {}, body: raw };

	const data = {};
	let continuedKey = null;
	for (const line of match[1].split(/\r?\n/)) {
		const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (kv) {
			const value = kv[2].trim().replace(/^['"]|['"]$/g, '');
			data[kv[1]] = value;
			continuedKey = value ? null : kv[1];
			continue;
		}
		if (continuedKey && /^\s+\S/.test(line)) {
			data[continuedKey] = `${data[continuedKey]} ${line.trim()}`.trim();
			continue;
		}
		continuedKey = null;
	}
	return { data, body: raw.slice(match[0].length) };
}

async function walk(dir) {
	const out = [];
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await walk(full)));
		else if (/\.mdx?$/.test(entry.name)) out.push(full);
	}
	return out;
}

// Mirrors Docusaurus' own id -> route rules: path relative to the docs root,
// extension dropped, a trailing `index`/`README` collapsing to its folder, and
// an explicit frontmatter `slug` winning over all of it.
function routeFor(relPath, slug) {
	if (slug) {
		return slug.startsWith('/') ?
				path.posix.join(ROUTE_BASE, slug)
			:	path.posix.join(ROUTE_BASE, path.posix.dirname(relPath), slug);
	}
	const id = relPath
		.replace(/\.mdx?$/, '')
		.replace(/(^|\/)(index|README)$/i, '');
	return path.posix.join(ROUTE_BASE, id);
}

// MDX pages open with a preamble of `import`/`export` statements for their JSX
// components. That is build machinery, not documentation. Imports of local
// Markdown partials (the `_*.mdx` files) are inlined -- they hold real shared
// documentation, and dropping them would publish twins missing whole sections.
// Imports of JSX components are stripped; their usages remain as-is in the
// body.
// Limitation: partials are used prop-less (`<CompanionOptions />`) in this repo,
// so plain body substitution is exact. If a partial ever takes props, this
// needs a real MDX render instead.
const IMPORT_RE = /^import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?\s*$/;

function inlinePartials(body, fileDir, loadPartial) {
	const statement =
		/^\s*(?:import|export)\s(?:[^\n]*?;\s*$|[\s\S]*?^\s*\}?\s*from\s[^\n]*$|[^\n]*$)/m;

	const partials = new Map();
	let rest = body.replace(/^\s+/, '');
	for (;;) {
		const match = statement.exec(rest);
		if (!match || match.index !== 0) break;
		const imp = IMPORT_RE.exec(match[0].trim());
		if (imp && /\.mdx?$/.test(imp[2]) && imp[2].startsWith('.')) {
			partials.set(imp[1], path.join(fileDir, imp[2]));
		}
		rest = rest.slice(match[0].length).replace(/^\s+/, '');
	}

	for (const [name, partialPath] of partials) {
		const usage = new RegExp(`<${name}\\s*/>`, 'g');
		if (!usage.test(rest)) continue;
		// A replacement function keeps `$&`, `$\`` and `$'` in Markdown code
		// samples literal instead of interpreting them as String.replace tokens.
		rest = rest.replace(usage, () => loadPartial(partialPath));
	}
	return rest.trim();
}

// Source-relative links must point at the generated route, not at an `.mdx`
// file that does not exist in the deployed site. Resolve through the same
// route map used for the twins so frontmatter slugs remain authoritative.
function rewriteLocalDocLinks(body, file, routeByFile) {
	return body.replace(
		/(\]\()(\.[^)\s?#]+\.mdx?)([?#][^)\s]*)?(\))/g,
		(match, prefix, reference, suffix = '', close) => {
			const target = path.resolve(path.dirname(file), reference);
			const route = routeByFile.get(target);
			return route ? `${prefix}${route}.md${suffix}${close}` : match;
		},
	);
}

function firstParagraph(body) {
	for (const block of body.split(/\r?\n\r?\n/)) {
		const text = block.trim();
		if (!text || text.startsWith('#') || text.startsWith(':::')) continue;
		if (text.startsWith('import ') || text.startsWith('export ')) continue;
		// Links flattened to their text: a mid-link truncation would leave an
		// unmatched bracket in llms.txt.
		const flat = text
			.replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, '$1')
			.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/<(https?:\/\/[^>]+)>/g, '$1')
			.replace(/\s+/g, ' ');
		if (flat.length <= 200) return flat;
		return `${flat.slice(0, flat.lastIndexOf(' ', 200))}…`;
	}
	return '';
}

// <UppyCdnExample> renders the same CDN code block the site shows, minus React.
// The surrounding caution is condensed for the Markdown twin.
const uppyVersion = require('uppy/package.json').version;

function renderCdnExample(match, props, inner) {
	const attr = (name, fallback) =>
		new RegExp(`${name}="([^"]+)"`).exec(props)?.[1] ?? fallback;
	const cssName = attr('uppyCssName', 'uppy.min.css');
	const jsName = attr('uppyJsName', 'uppy.min.mjs');
	const jsUrl = `https://releases.transloadit.com/uppy/v${uppyVersion}/${jsName}`;

	const lines = inner
		.replace(/^[\s{`]+|[`}\s]+$/g, '')
		.split('\n')
		.map((line) => `  ${line.trim()}`)
		.join('\n')
		.replace(/{{UPPY_JS_URL}}/g, jsUrl);

	return [
		'> **Caution:** this CDN bundle contains most Uppy plugins, so it is not',
		'> recommended for production. It is useful to get started quickly.',
		'',
		'```html',
		'<!-- 1. Add CSS to `<head>` -->',
		`<link href="https://releases.transloadit.com/uppy/v${uppyVersion}/${cssName}" rel="stylesheet">`,
		'',
		'<!-- 2. Initialize -->',
		'<div id="uppy"></div>',
		'',
		'<script type="module">',
		lines,
		'</script>',
		'```',
	].join('\n');
}

// Docusaurus MDX pages use a handful of JSX components. In the Markdown twins
// these are demoted to plain Markdown where the content is recoverable
// (tab wrappers, links, inline item lists) and replaced with an explicit
// pointer to the rendered page where it is not (live demos, TSX-only
// content). Leaving raw JSX would silently omit content; a visible pointer
// is honest about what the Markdown version lacks.
function demoteJsxChunk(text, pageUrl) {
	let out = text;

	// <Tabs>/<TabItem> are layout: keep the content, turn labels into bold.
	out = out.replace(/<Tabs[^>]*>|<\/Tabs>/g, '');
	out = out.replace(
		/<TabItem[^>]*?(?:label|value)="([^"]+)"[^>]*>/g,
		(m, label) => {
			const better = /label="([^"]+)"/.exec(m);
			return `**${better ? better[1] : label}**\n`;
		},
	);
	out = out.replace(/<\/TabItem>/g, '');

	// Docusaurus <Link> is a plain link.
	out = out.replace(
		/<Link\s+(?:to|href)="([^"]+)"[^>]*>([\s\S]*?)<\/Link>/g,
		'[$2]($1)',
	);

	// QuickStartLinks carries its items inline in the MDX; render them.
	out = out.replace(/<QuickStartLinks[\s\S]*?\/>/g, (m) => {
		const items = [
			...m.matchAll(
				/name:\s*'([^']*)'[\s\S]*?description:\s*'([^']*)'[\s\S]*?link:\s*'([^']*)'/g,
			),
		];
		return items
			.map(([, name, desc, link]) => `- [${name}](${link}) — ${desc}`)
			.join('\n');
	});

	// Anything left is a live demo or TSX-only content: say so, and say where
	// the rendered version lives, instead of dropping it silently.
	out = out.replace(
		/<[A-Z][A-Za-z]*(?:\s[^<>]*?)?\/>/g,
		`*(A rendered component is omitted from the Markdown version — see ${pageUrl} for the full page.)*`,
	);

	// Collapse runs of identical omission notes.
	out = out.replace(/(\*\(A rendered component[^)]*\)\*)(\s*\1)+/g, '$1');

	return out;
}

function demoteJsx(body, pageUrl) {
	// Render this wrapper before protecting Markdown code spans: its JavaScript
	// template can itself contain escaped backticks, which are not Markdown code.
	const renderedCdnExamples = body.replace(
		/^[ \t]*<UppyCdnExample([^>]*)>([\s\S]*?)<\/UppyCdnExample>/gm,
		renderCdnExample,
	);

	// Fenced code blocks and inline code spans are documentation and must
	// survive untouched.
	return renderedCdnExamples
		.split(/(```[\s\S]*?```|`[^`\n]*`)/)
		.map((chunk, i) => (i % 2 ? chunk : demoteJsxChunk(chunk, pageUrl)))
		.join('')
		.replace(/\n{3,}/g, '\n\n');
}

// An OpenAPI description of the documentation *content* API: the pages, their
// Markdown twins, and the machine-readable indexes. Generated from the same
// page list as llms.txt so the two can never disagree. This describes what
// uppy.io actually serves -- every response here is reproducible with curl.
function buildOpenApi(siteConfig, site, pages) {
	// The root docs page (route /docs) gets its own literal path entries; the
	// {slug} parameter cannot express an empty value. Slugs containing a slash
	// also get literal entries: a single path parameter never matches across
	// `/` (a generated client would percent-encode it), so enum-ing them under
	// {slug} would document requests that 404.
	const allSlugs = pages
		.map((p) => p.route.replace(/^\/docs\/?/, ''))
		.filter(Boolean);
	const slugs = allSlugs.filter((slug) => !slug.includes('/'));
	const nested = allSlugs.filter((slug) => slug.includes('/'));

	const literalPage = (route, title) => ({
		get: {
			tags: ['pages'],
			operationId: `get${route.replace(/[^a-zA-Z0-9]+/g, '_')}`,
			summary: `Fetch ${title} as HTML.`,
			responses: {
				200: {
					description: 'The rendered page.',
					content: { 'text/html': { schema: { type: 'string' } } },
				},
			},
		},
	});
	const literalMd = (route, title) => ({
		get: {
			tags: ['pages'],
			operationId: `get${route.replace(/[^a-zA-Z0-9]+/g, '_')}_md`,
			summary: `Fetch ${title} as Markdown.`,
			responses: {
				200: {
					description: 'The page source.',
					content: { 'text/markdown': { schema: { type: 'string' } } },
				},
			},
		},
	});

	const literalPaths = {};
	const rootPage = pages.find(({ route }) => route === '/docs');
	if (rootPage) {
		literalPaths['/docs/'] = literalPage('/docs/', rootPage.title);
		literalPaths['/docs.md'] = literalMd('/docs.md', rootPage.title);
	}
	for (const slug of nested) {
		literalPaths[`/docs/${slug}/`] = literalPage(`/docs/${slug}/`, `"${slug}"`);
		literalPaths[`/docs/${slug}.md`] = literalMd(
			`/docs/${slug}.md`,
			`"${slug}"`,
		);
	}

	const notFound = {
		description:
			'No such page. The body links llms.txt (the documentation index), llms-full.txt (the full documentation), openapi.json and the sitemap so a client can recover.',
		content: { 'text/html': { schema: { type: 'string' } } },
	};

	const plainText = (description) => ({
		description,
		content: { 'text/plain': { schema: { type: 'string' } } },
	});

	return {
		openapi: '3.1.0',
		info: {
			title: `${siteConfig.title} documentation content API`,
			summary: 'Read-only HTTP access to the Uppy documentation.',
			description: [
				'uppy.io serves its documentation as static files. Every documentation page is',
				'available as HTML and as Markdown. For Markdown, replace the HTML path’s',
				'trailing slash with `.md` (`/docs/quick-start/` becomes `/docs/quick-start.md`).',
				'The whole corpus is indexed by llms.txt.',
				'',
				'This is a content API, not a service API: every operation is a GET,',
				'nothing is authenticated, and nothing has side effects. The Uppy',
				'*server* component is Companion, which is documented separately at',
				`${site}/docs/companion.`,
			].join('\n'),
			version: '1.0.0',
		},
		servers: [{ url: site }],
		tags: [
			{
				name: 'pages',
				description: 'Documentation pages, as HTML or Markdown.',
			},
			{ name: 'indexes', description: 'Machine-readable indexes of the site.' },
		],
		paths: {
			...literalPaths,
			'/docs/{slug}/': {
				get: {
					tags: ['pages'],
					operationId: 'getDocPage',
					summary: 'Fetch a documentation page as HTML.',
					parameters: [
						{
							name: 'slug',
							in: 'path',
							required: true,
							description:
								'Single-segment page identifier. Nested pages (a slug containing a slash) are described as literal paths in this document.',
							schema: { type: 'string', enum: slugs },
						},
					],
					responses: {
						200: {
							description: 'The rendered page.',
							content: { 'text/html': { schema: { type: 'string' } } },
						},
						404: notFound,
					},
				},
			},
			'/docs/{slug}.md': {
				get: {
					tags: ['pages'],
					operationId: 'getDocPageMarkdown',
					summary: 'Fetch the same page as Markdown.',
					description:
						'Preferred for agents: the Markdown is the documentation source, without site chrome.',
					parameters: [
						{
							name: 'slug',
							in: 'path',
							required: true,
							description:
								'Single-segment page identifier. Nested pages (a slug containing a slash) are described as literal paths in this document.',
							schema: { type: 'string', enum: slugs },
						},
					],
					responses: {
						200: {
							description: 'The page source.',
							content: { 'text/markdown': { schema: { type: 'string' } } },
						},
						404: notFound,
					},
				},
			},
			'/llms.txt': {
				get: {
					tags: ['indexes'],
					operationId: 'getLlmsIndex',
					summary: 'Index of the documentation, in llmstxt.org format.',
					responses: {
						200: plainText(
							`An llmstxt.org index linking every page's Markdown twin.`,
						),
					},
				},
			},
			'/llms-full.txt': {
				get: {
					tags: ['indexes'],
					operationId: 'getLlmsFull',
					summary: 'The entire documentation as one Markdown file.',
					responses: {
						200: plainText('Every documentation page, concatenated.'),
					},
				},
			},
			'/openapi.json': {
				get: {
					tags: ['indexes'],
					operationId: 'getOpenApi',
					summary: 'OpenAPI 3.1 description of this documentation content API.',
					responses: {
						200: {
							description: 'This OpenAPI document.',
							content: {
								'application/json': { schema: { type: 'object' } },
							},
						},
					},
				},
			},
			'/sitemap.xml': {
				get: {
					tags: ['indexes'],
					operationId: 'getSitemap',
					summary: 'Every URL on this site.',
					responses: {
						200: {
							description: 'A urlset sitemap.',
							content: { 'application/xml': { schema: { type: 'string' } } },
						},
					},
				},
			},
			'/robots.txt': {
				get: {
					tags: ['indexes'],
					operationId: 'getRobots',
					summary: 'Crawler policy, pointing at the sitemap.',
					responses: { 200: plainText('A robots.txt naming the sitemap.') },
				},
			},
		},
	};
}

module.exports = function agentReadiness(context) {
	const { siteDir, siteConfig } = context;
	const site = siteConfig.url.replace(/\/$/, '');

	return {
		name: 'agent-readiness',

		async postBuild({ outDir }) {
			const docsRoot = path.join(siteDir, DOCS_DIR);
			const files = (await walk(docsRoot)).sort();

			const pages = [];
			const sourcePages = [];
			const skipped = [];

			// Loads a `_*.mdx` partial for inlining: frontmatter off, its own
			// preamble stripped (partials may import components too).
			const partialCache = new Map();
			const loadPartial = (partialPath) => {
				if (!partialCache.has(partialPath)) {
					const raw = require('node:fs').readFileSync(partialPath, 'utf8');
					const { body } = splitFrontmatter(raw);
					partialCache.set(
						partialPath,
						inlinePartials(body, path.dirname(partialPath), loadPartial),
					);
				}
				return partialCache.get(partialPath);
			};

			for (const file of files) {
				const relPath = path.relative(docsRoot, file).split(path.sep).join('/');
				const raw = await fs.readFile(file, 'utf8');
				const { data, body } = splitFrontmatter(raw);
				const route = routeFor(relPath, data.slug);

				// The built HTML is the source of truth for which routes exist. If a
				// doc did not produce one, our route guess is wrong -- say so loudly
				// rather than publishing a link that 404s.
				const builtHtml = path.join(
					outDir,
					route.replace(/^\//, ''),
					'index.html',
				);
				try {
					await fs.access(builtHtml);
				} catch {
					skipped.push(relPath);
					continue;
				}

				const title =
					data.title ||
					(/^#\s+(.+)$/m.exec(body)?.[1] ?? '').trim() ||
					path.basename(relPath, path.extname(relPath));

				sourcePages.push({
					file,
					route,
					title,
					description: data.description || firstParagraph(body),
					body,
				});
			}

			const routeByFile = new Map(
				sourcePages.map(({ file, route }) => [path.resolve(file), route]),
			);
			for (const page of sourcePages) {
				pages.push({
					route: page.route,
					title: page.title,
					description: page.description,
					body: demoteJsx(
						rewriteLocalDocLinks(
							inlinePartials(page.body, path.dirname(page.file), loadPartial),
							page.file,
							routeByFile,
						),
						`${site}${page.route}`,
					),
				});
			}

			// Quick start is the entry point agents should read first; everything
			// else reads better alphabetically than in file-path order.
			pages.sort((a, b) => {
				const rank = (p) => (p.route === '/docs/quick-start' ? 0 : 1);
				return rank(a) - rank(b) || a.title.localeCompare(b.title);
			});

			// `.md` twin next to each built page, so an agent can fetch the Markdown
			// source by URL even where the host cannot content-negotiate.
			for (const page of pages) {
				const target = path.join(outDir, `${page.route.replace(/^\//, '')}.md`);
				await fs.mkdir(path.dirname(target), { recursive: true });
				await fs.writeFile(
					target,
					// Docs that already open with an H1 keep theirs; the rest get one
					// so every twin has a title.
					page.body.startsWith('# ') ?
						`${page.body}\n\nSource: ${site}${page.route}\n`
					:	`# ${page.title}\n\nSource: ${site}${page.route}\n\n${page.body}\n`,
				);
			}

			// Keep this capability summary synchronized with the SoftwareApplication
			// JSON-LD in docusaurus.config.js and the supported integration docs.
			const index = [
				`# ${siteConfig.title}`,
				'',
				`> ${siteConfig.tagline}`,
				'',
				'Uppy is an open source JavaScript file uploader for the browser. It',
				'uploads from disk and from remote sources such as Google Drive, Dropbox',
				'and OneDrive, resumes interrupted uploads over the tus protocol, and has',
				'official bindings for React, Vue, Svelte and Angular.',
				'',
				'For a Markdown twin, replace the HTML URL’s trailing slash with `.md`',
				'(`/docs/quick-start/` becomes `/docs/quick-start.md`).',
				'',
				'## Documentation',
				'',
				...pages.map(
					(p) =>
						`- [${p.title}](${site}${p.route}.md)${p.description ? `: ${p.description}` : ''}`,
				),
				'',
				'## Optional',
				'',
				`- [OpenAPI](${site}/openapi.json): Machine-readable description of the documentation content API.`,
				`- [Examples](${site}/examples): Live, runnable Uppy demos.`,
				`- [Blog](${site}/blog): Release notes and announcements.`,
				`- [Sitemap](${site}/sitemap.xml): Every URL on this site.`,
				`- [Source](https://github.com/transloadit/uppy): The Uppy monorepo on GitHub.`,
				'',
			].join('\n');

			const full = [
				`# ${siteConfig.title} — full documentation`,
				'',
				`> ${siteConfig.tagline}`,
				'',
				...pages.flatMap((p) => [
					'---',
					'',
					`Source: ${site}${p.route}`,
					'',
					p.body.startsWith('# ') ? p.body : `# ${p.title}\n\n${p.body}`,
					'',
				]),
			].join('\n');

			await fs.writeFile(path.join(outDir, 'llms.txt'), index);
			await fs.writeFile(path.join(outDir, 'llms-full.txt'), full);
			await fs.writeFile(
				path.join(outDir, 'openapi.json'),
				`${JSON.stringify(buildOpenApi(siteConfig, site, pages), null, 2)}\n`,
			);

			console.log(
				`[agent-readiness] ${pages.length} pages -> llms.txt, llms-full.txt, openapi.json, .md twins`,
			);
			// `_`-prefixed files are partials, consumed by inlinePartials above;
			// them having no route of their own is expected. Anything else
			// missing a route means the route derivation disagrees with
			// Docusaurus -- fail the build rather than silently publishing an
			// index without that page.
			const unexpected = skipped.filter(
				(rel) => !path.basename(rel).startsWith('_'),
			);
			if (unexpected.length) {
				throw new Error(
					`[agent-readiness] no built route for: ${unexpected.join(', ')} -- route derivation is out of sync with Docusaurus`,
				);
			}
		},
	};
};
