import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import type { Props } from '@theme/NotFound/Content';
import Heading from '@theme/Heading';

// These are static files, not routes; `<Link>` would append the configured
// trailing slash and turn /llms.txt into /llms.txt/, which 404s.
/* eslint-disable @docusaurus/no-html-links -- Static-file URLs must preserve their exact path. */

// Recovery links rendered into the 404 body so that crawlers and AI agents that
// hit a dead URL can find their way back without executing JavaScript.
const recoveryLinks = [
	{
		to: '/docs/quick-start',
		label: 'Quick start',
		hint: 'Install and use Uppy',
	},
	{ to: '/docs/companion', label: 'Companion', hint: 'The server component' },
	{ to: '/examples', label: 'Examples', hint: 'Live, runnable demos' },
	{ to: '/blog', label: 'Blog', hint: 'Releases and announcements' },
];

const machineReadableLinks = [
	{ href: '/llms.txt', label: '/llms.txt', hint: 'Index of the docs for LLMs' },
	{
		href: '/llms-full.txt',
		label: '/llms-full.txt',
		hint: 'Full docs as one file',
	},
	{
		href: '/openapi.json',
		label: '/openapi.json',
		hint: 'OpenAPI description of the documentation',
	},
	{
		href: '/sitemap.xml',
		label: '/sitemap.xml',
		hint: 'Every page on this site',
	},
];

export default function NotFoundContent({ className }: Props): ReactNode {
	return (
		<main className={clsx('container margin-vert--xl', className)}>
			<div className="row">
				<div className="col col--6 col--offset-3">
					<Heading as="h1" className="hero__title">
						<Translate
							id="theme.NotFound.title"
							description="The title of the 404 page"
						>
							Page Not Found
						</Translate>
					</Heading>
					<p>
						<Translate
							id="theme.NotFound.p1"
							description="The first paragraph of the 404 page"
						>
							We could not find what you were looking for.
						</Translate>
					</p>

					<Heading as="h2">Where to look next</Heading>
					<ul>
						{recoveryLinks.map(({ to, label, hint }) => (
							<li key={to}>
								<Link to={to}>{label}</Link> — {hint}
							</li>
						))}
					</ul>

					<Heading as="h2">Machine-readable indexes</Heading>
					<ul>
						{machineReadableLinks.map(({ href, label, hint }) => (
							<li key={href}>
								{/* Plain anchors: these are static files, and Docusaurus'
								    Link would append the site's trailing slash. */}
								<a href={href}>{label}</a> — {hint}
							</li>
						))}
					</ul>

					<p>
						For a Markdown twin, replace the HTML URL’s trailing slash with{' '}
						<code>.md</code>: <code>/docs/quick-start/</code> →{' '}
						<a href="/docs/quick-start.md">/docs/quick-start.md</a>.
					</p>
					<p>
						<Translate
							id="theme.NotFound.p2"
							description="The 2nd paragraph of the 404 page"
						>
							Please contact the owner of the site that linked you to the
							original URL and let them know their link is broken.
						</Translate>
					</p>
				</div>
			</div>
		</main>
	);
}
