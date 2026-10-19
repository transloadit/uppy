import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	parseAccept,
	markdownType,
	prefersJson,
	markdownUrl,
	jsonError,
	markdownError,
	mergeVary,
} from '../worker/index.js';
import worker from '../worker/index.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'build');

// Each test pins one failure mode found by review or audit; asserts for the
// same mode are grouped rather than split into micro-tests.

describe('content negotiation', () => {
	test('parseAccept orders by q-value and drops q=0', () => {
		assert.deepEqual(
			parseAccept('text/html;q=0.8, text/markdown;q=0.9, image/png;q=0'),
			['text/markdown', 'text/html'],
		);
		assert.deepEqual(parseAccept(null), []);
	});

	test('markdown is served exactly when it outranks html', () => {
		assert.equal(markdownType('text/markdown'), 'text/markdown');
		assert.equal(
			markdownType('text/html;q=0.8, text/markdown;q=0.9'),
			'text/markdown',
		);
		// The client gets the media type it asked for, not our favourite label.
		assert.equal(markdownType('text/plain'), 'text/plain');
	});

	// The regression that matters: a browser must never be handed markdown.
	test('browsers, wildcards and Q=0 keep getting html', () => {
		assert.equal(
			markdownType(
				'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			),
			null,
		);
		assert.equal(markdownType('*/*'), null);
		// RFC 9110: q is case-insensitive, q=0 means explicitly unacceptable.
		assert.equal(markdownType('text/markdown;Q=0, text/html'), null);
		assert.equal(markdownType('application/json'), null);
		assert.equal(prefersJson('application/json'), true);
		assert.equal(
			prefersJson('text/markdown;q=1, application/json;q=0.5'),
			false,
		);
		assert.equal(
			prefersJson('application/json;q=1, text/markdown;q=0.5'),
			true,
		);
		assert.equal(prefersJson('text/html,*/*;q=0.8'), false);
	});

	test('markdownUrl maps a page to its twin', () => {
		assert.equal(
			markdownUrl('https://uppy.io/docs/quick-start/'),
			'https://uppy.io/docs/quick-start.md',
		);
		assert.equal(
			markdownUrl('https://uppy.io/docs/companion'),
			'https://uppy.io/docs/companion.md',
		);
	});

	test('mergeVary appends without clobbering or duplicating', () => {
		const h = new Headers({ vary: 'Origin' });
		mergeVary(h, 'Accept', 'Accept-Encoding');
		assert.equal(h.get('vary'), 'Origin, Accept, Accept-Encoding');
		const dup = new Headers({ vary: 'accept-encoding' });
		mergeVary(dup, 'Accept', 'Accept-Encoding');
		assert.equal(dup.get('vary'), 'Accept-Encoding, Accept');
	});
});

describe('error responses', () => {
	test('a JSON 404 carries code, message, hint and Vary: Accept', async () => {
		const res = jsonError(404, 'https://uppy.io/nope');
		assert.equal(res.status, 404);
		assert.equal(
			res.headers.get('content-type'),
			'application/json; charset=utf-8',
		);
		assert.equal(res.headers.get('vary'), 'Accept, Accept-Encoding');
		const { error } = await res.json();
		assert.equal(error.code, 'not_found');
		assert.match(error.message, /\/nope/);
		assert.match(error.resolution, /llms\.txt/);
	});

	test('resolutions are status-specific and unmapped statuses still work', async () => {
		const gone = (await jsonError(410, 'https://uppy.io/x').json()).error;
		assert.match(gone.resolution, /permanently removed/);
		assert.ok(!/retry/i.test(gone.resolution));
		const forbidden = (await jsonError(403, 'https://uppy.io/x').json()).error;
		assert.match(forbidden.resolution, /will not succeed/);
		const other = (await jsonError(503, 'https://uppy.io/x').json()).error;
		assert.equal(other.code, 'http_error');
	});

	test('load-bearing origin headers survive the body swap', () => {
		const origin = new Response(null, {
			status: 429,
			headers: { 'retry-after': '30', vary: 'Origin' },
		});
		const res = jsonError(429, 'https://uppy.io/x', origin);
		assert.equal(res.headers.get('retry-after'), '30');
		assert.match(res.headers.get('vary'), /Accept/);
	});

	test('a markdown 404 is markdown, with recovery links', async () => {
		const res = markdownError(404, 'text/markdown');
		assert.equal(res.status, 404);
		assert.match(res.headers.get('content-type'), /text\/markdown/);
		assert.match(await res.text(), /llms\.txt/);
	});
});

// These assert on real build output. They are the check that the Docusaurus
// plugin actually ran, so they only make sense once `yarn build` has.
describe(
	'build output',
	{ skip: !fs.existsSync(buildDir) && 'run `yarn build` first' },
	() => {
		const read = (p) => fs.readFileSync(path.join(buildDir, p), 'utf8');
		const twins = () =>
			fs
				.readdirSync(path.join(buildDir, 'docs'), { recursive: true })
				.filter((f) => typeof f === 'string' && f.endsWith('.md'));

		test('robots.txt points at the sitemap', () => {
			assert.match(
				read('robots.txt'),
				/^Sitemap: https:\/\/uppy\.io\/sitemap\.xml$/m,
			);
		});

		test('llms.txt follows llmstxt.org and links only to built twins', () => {
			const llms = read('llms.txt');
			assert.match(llms, /^# Uppy\n/);
			assert.match(llms, /^> .+/m); // summary blockquote
			assert.match(llms, /^## Documentation$/m);
			assert.match(llms, /\(https:\/\/uppy\.io\/openapi\.json\)/);
			assert.doesNotMatch(llms, /\[[^\]]+\]\[[^\]]*\]/);
			assert.doesNotMatch(llms, /<https?:\/\//);
			assert.match(
				llms,
				/- \[Uppy documentation\]\(https:\/\/uppy\.io\/docs\.md\): Install Uppy, choose an uploader, add UI plugins, integrate frameworks, and configure Companion for remote sources\./,
			);
			assert.doesNotMatch(llms, /Uppy documentation.*application needs:/);
			const links = [
				...llms.matchAll(/\(https:\/\/uppy\.io(\/docs\S*?\.md)\)/g),
			].map(([, route]) => route);
			assert.ok(
				links.length > 40,
				`expected many doc links, got ${links.length}`,
			);
			for (const route of links) {
				assert.ok(
					fs.existsSync(path.join(buildDir, route.replace(/^\//, ''))),
					`llms.txt links to ${route} but no such file was built`,
				);
			}
		});

		test('llms-full.txt inlines the documentation body', () => {
			const full = read('llms-full.txt');
			assert.ok(
				full.length > 400_000,
				`expected full docs, got ${full.length}`,
			);
			assert.match(full, /^Source: https:\/\/uppy\.io\/docs\//m);
		});

		test('twins are clean markdown: no frontmatter, preamble, or dup title', () => {
			const all = twins();
			assert.ok(all.length > 40, `expected many twins, got ${all.length}`);
			for (const twin of all) {
				const body = read(path.join('docs', twin));
				assert.ok(!body.startsWith('---'), `${twin} leaks frontmatter`);
				assert.ok(
					!/^\s*(import|export)\s/.test(body.split('\n', 1)[0]),
					`${twin} starts with an MDX statement`,
				);
				assert.match(body, /^# ./m, `${twin} has no H1`);
				assert.doesNotMatch(
					body,
					/^ {4}> \*\*Caution:/m,
					`${twin} renders its CDN warning as a code block`,
				);
				assert.doesNotMatch(
					body,
					/\.mdx(?:[?#][^)\s]*)?\)/,
					`${twin} links to an undeployed MDX source`,
				);
			}
			const qs = read('docs/quick-start.md');
			assert.equal((qs.match(/^# Quick start$/gm) ?? []).length, 1);
			assert.match(read('docs.md'), /Choose an uploader/);
		});

		test('no unresolved JSX remains outside code in any twin', () => {
			for (const twin of twins()) {
				const body = read(path.join('docs', twin))
					.replace(/```[\s\S]*?```/g, '')
					.replace(/`[^`\n]*`/g, '');
				const knownTags =
					body.match(
						/<\/?(?:Tabs|TabItem|UppyCdnExample|QuickStartLinks|Link)\b[^>]*>/g,
					) ?? [];
				const selfClosingTags =
					body.match(/<[A-Z][A-Za-z]*(?:\s[^<>]*?)?\/>/g) ?? [];
				const jsx = [...knownTags, ...selfClosingTags];
				assert.deepEqual(jsx, [], `${twin} has unresolved JSX: ${jsx}`);
			}
		});

		test('JSX content is recovered, not dropped', () => {
			// Partials (the adversarial review's High finding), tabs, the CDN
			// example, quick-start links -- and code examples must survive.
			assert.match(read('docs/react.md'), /useDropzone/);
			const dropbox = read('docs/dropbox.md');
			assert.match(dropbox, /companionUrl/);
			assert.ok(
				dropbox.includes('new RegExp(`^${value}$`);'),
				'partial replacement changed JavaScript replacement tokens',
			);
			assert.equal(
				(dropbox.match(/^## API$/gm) ?? []).length,
				1,
				'partial replacement duplicated the surrounding page',
			);
			const tus = read('docs/tus.md');
			assert.match(tus, /^\s*\*\*NPM\*\*$/m);
			assert.match(
				tus,
				/releases\.transloadit\.com\/uppy\/v\d+\.\d+\.\d+\/uppy\.min\.css/,
			);
			assert.match(
				read('docs/quick-start.md'),
				/- \[I want a full featured, extendable UI\]\(\/docs\/dashboard\)/,
			);
			const react = read('docs/react.md');
			assert.match(react, /A rendered component is omitted from the Markdown/);
			assert.ok(react.includes('`<Dashboard />`'), 'inline code span mangled');
			assert.match(
				read('docs/angular.md'),
				/```typescript[\s\S]*?^import \{ NgModule \}/m,
			);
			assert.match(
				read('docs/google-drive-picker.md'),
				/\[Google Photos Picker\]\(\/docs\/google-photos-picker\.md\)/,
			);
		});

		test('openapi.json is valid, complete, and matches the build', () => {
			const spec = JSON.parse(read('openapi.json'));
			assert.equal(spec.openapi, '3.1.0');
			assert.equal(spec.servers[0].url, 'https://uppy.io');
			assert.equal(spec.info.license, undefined);
			for (const p of [
				'/docs/{slug}/',
				'/docs/{slug}.md',
				'/docs/',
				'/docs.md',
				'/llms.txt',
				'/openapi.json',
				'/sitemap.xml',
			]) {
				assert.ok(spec.paths[p]?.get, `spec is missing GET ${p}`);
			}
			assert.ok(
				fs.existsSync(path.join(buildDir, 'docs', 'index.html')) &&
					fs.existsSync(path.join(buildDir, 'docs.md')),
				'OpenAPI root documentation paths do not exist in the build',
			);
			for (const route of Object.keys(spec.paths)) {
				if (!route.startsWith('/docs/') || route.endsWith('.md')) continue;
				assert.ok(route.endsWith('/'), `HTML docs path lacks slash: ${route}`);
			}
			// Every enum slug must be single-segment and actually built.
			const slugs = spec.paths['/docs/{slug}.md'].get.parameters[0].schema.enum;
			assert.ok(slugs.length > 40, `expected many slugs, got ${slugs.length}`);
			for (const slug of slugs) {
				assert.ok(!slug.includes('/'), `multi-segment slug in enum: ${slug}`);
				assert.ok(
					fs.existsSync(path.join(buildDir, 'docs', `${slug}.md`)) &&
						fs.existsSync(path.join(buildDir, 'docs', slug, 'index.html')),
					`spec lists ${slug} but it was not built`,
				);
			}
			// And nothing llms.txt links may be missing from the spec.
			const literal = new Set(Object.keys(spec.paths));
			const slugSet = new Set(slugs);
			for (const [, route] of read('llms.txt').matchAll(
				/https:\/\/uppy\.io(\/docs\S*?\.md)\)/g,
			)) {
				const slug = route.replace(/^\/docs\//, '').replace(/\.md$/, '');
				assert.ok(
					slugSet.has(slug) || literal.has(route),
					`llms.txt links ${route} but the spec omits it`,
				);
			}
		});

		test('the 404 page gives agents somewhere to go', () => {
			const html = read('404.html');
			for (const target of [
				'/llms.txt',
				'/openapi.json',
				'/sitemap.xml',
				'/docs/quick-start',
			]) {
				assert.ok(html.includes(target), `404 page should link to ${target}`);
			}
		});

		test('JSON-LD is emitted site-wide with the fields agents look for', () => {
			for (const page of [
				'index.html',
				'404.html',
				'docs/quick-start/index.html',
			]) {
				const match =
					/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
						read(page),
					);
				assert.ok(match, `${page} has no JSON-LD block`);
				const graph = JSON.parse(match[1])['@graph'];
				const types = graph.map((n) => n['@type']);
				for (const t of ['Organization', 'WebSite', 'SoftwareApplication']) {
					assert.ok(types.includes(t), `${page} JSON-LD is missing ${t}`);
				}
				if (page !== 'index.html') continue;
				const app = graph.find((n) => n['@type'] === 'SoftwareApplication');
				for (const f of [
					'name',
					'description',
					'codeRepository',
					'license',
					'offers',
				]) {
					assert.ok(app[f], `SoftwareApplication is missing ${f}`);
				}
				// A dangling @id reference gets silently dropped by consumers.
				const ids = new Set(graph.map((n) => n['@id']));
				assert.ok(ids.has(app.author['@id']), 'author @id does not resolve');
			}
		});

		test('the homepage is readable without JavaScript', () => {
			const html = read('index.html');
			assert.match(html, /<h1[^>]*>/);
			assert.match(
				html,
				/<meta[^>]*name="description"[^>]*content="[^"]{50,}"/,
			);
			const text = html
				.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/g, '')
				.replace(/<[^>]+>/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
			assert.ok(text.length > 500, `homepage text too thin: ${text.length}`);
		});
	},
);

// Exercises the Worker's request handler against a stubbed GitHub Pages origin,
// so the negotiation and error paths are covered without a network or a
// Cloudflare runtime.
describe('worker request handling', () => {
	const origin = (url, init) => {
		const { pathname } = new URL(url);
		if (pathname === '/docs/quick-start.md') {
			if (init?.headers?.['if-none-match'] === '"twin-etag"')
				return new Response(null, {
					status: 304,
					headers: { etag: '"twin-etag"' },
				});
			return new Response('# Quick start\n', {
				status: 200,
				headers: { 'content-type': 'text/plain', etag: '"twin-etag"' },
			});
		}
		if (pathname === '/docs/quick-start/')
			return new Response('<html><h1>Quick start</h1></html>', {
				status: 200,
				headers: { 'content-type': 'text/html; charset=utf-8' },
			});
		if (pathname === '/examples/')
			return new Response('<html><h1>Examples</h1></html>', {
				status: 200,
				headers: { 'content-type': 'text/html; charset=utf-8', vary: 'Origin' },
			});
		if (pathname === '/img/logo.svg')
			return new Response('<svg/>', {
				status: 200,
				headers: { 'content-type': 'image/svg+xml' },
			});
		if (pathname === '/not-modified/')
			return new Response(null, { status: 304 });
		return new Response('<html>Page Not Found</html>', {
			status: 404,
			headers: { 'content-type': 'text/html; charset=utf-8' },
		});
	};

	const call = async (path, accept, method = 'GET', extraHeaders = {}) => {
		const real = globalThis.fetch;
		globalThis.fetch = async (input, init) =>
			origin(typeof input === 'string' ? input : input.url, init);
		try {
			return await worker.fetch(
				new Request(`https://uppy.io${path}`, {
					method,
					headers: { ...(accept ? { accept } : {}), ...extraHeaders },
				}),
			);
		} finally {
			globalThis.fetch = real;
		}
	};

	test('markdown agents get the twin; browsers get html; both Vary', async () => {
		const md = await call('/docs/quick-start/', 'text/markdown');
		assert.equal(md.status, 200);
		assert.equal(
			md.headers.get('content-type'),
			'text/markdown; charset=utf-8',
		);
		assert.equal(md.headers.get('vary'), 'Accept, Accept-Encoding');
		assert.match(await md.text(), /^# Quick start/);

		const html = await call('/docs/quick-start/', 'text/html,*/*;q=0.8');
		assert.match(html.headers.get('content-type'), /text\/html/);
		assert.match(html.headers.get('vary'), /Accept/);
	});

	test('a missing twin falls back to the html page, preserving its Vary', async () => {
		const res = await call('/examples/', 'text/markdown');
		assert.equal(res.status, 200);
		assert.match(res.headers.get('content-type'), /text\/html/);
		assert.equal(res.headers.get('vary'), 'Origin, Accept, Accept-Encoding');
	});

	test('errors negotiate: markdown 404, json 404, browser html 404', async () => {
		const md = await call('/does-not-exist/', 'text/markdown');
		assert.equal(md.status, 404);
		assert.match(md.headers.get('content-type'), /text\/markdown/);

		const json = await call('/does-not-exist/', 'application/json');
		assert.equal(json.status, 404);
		assert.equal((await json.json()).error.code, 'not_found');

		const mixedMarkdown = await call(
			'/does-not-exist/',
			'text/markdown;q=1, application/json;q=0.5',
		);
		assert.match(mixedMarkdown.headers.get('content-type'), /text\/markdown/);
		const mixedJson = await call(
			'/does-not-exist/',
			'application/json;q=1, text/markdown;q=0.5',
		);
		assert.match(mixedJson.headers.get('content-type'), /application\/json/);

		// Machine-readable paths must not bypass error negotiation.
		const asset = await call('/missing.json', 'application/json');
		assert.match(asset.headers.get('content-type'), /application\/json/);

		const html = await call('/does-not-exist/', 'text/html,*/*;q=0.8');
		assert.equal(html.status, 404);
		assert.match(html.headers.get('content-type'), /text\/html/);
	});

	test('conditional requests earn a 304; a bare 304 never crashes', async () => {
		const cond = await call('/docs/quick-start/', 'text/markdown', 'GET', {
			'if-none-match': '"twin-etag"',
		});
		assert.equal(cond.status, 304);
		assert.equal(cond.body, null);
		// A bodied 304 throws in the Workers runtime; it must pass through.
		const bare = await call('/not-modified/', 'application/json');
		assert.equal(bare.status, 304);
	});

	test('non-GET success responses and assets pass through untouched', async () => {
		const post = await call('/docs/quick-start/', 'text/markdown', 'POST');
		assert.match(post.headers.get('content-type'), /text\/html/);
		const asset = await call('/img/logo.svg', 'text/markdown');
		assert.equal(asset.headers.get('content-type'), 'image/svg+xml');
	});

	test('non-GET errors are structured for clients that prefer JSON', async () => {
		const post = await call('/does-not-exist/', 'application/json', 'POST');
		assert.equal(post.status, 404);
		assert.equal((await post.json()).error.code, 'not_found');
	});
});
