import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const columns = [
	{
		title: 'Documentation',
		links: [
			{ label: 'Quick start', to: '/docs/quick-start' },
			{ label: 'Dashboard', to: '/docs/dashboard' },
			{ label: 'Companion', to: '/docs/companion' },
			{ label: 'Remote sources', to: '/docs/remote-sources' },
			{ label: 'Tus uploader', to: '/docs/tus' },
			{ label: 'Comparison', to: '/docs/comparison' },
		],
	},
	{
		title: 'Frameworks',
		links: [
			{ label: 'React', to: '/docs/react' },
			{ label: 'Next.js', to: '/docs/nextjs' },
			{ label: 'Vue', to: '/docs/vue' },
			{ label: 'Svelte', to: '/docs/svelte' },
			{ label: 'Angular', to: '/docs/angular' },
		],
	},
	{
		title: 'Community',
		links: [
			{ label: 'GitHub', href: 'https://github.com/transloadit/uppy' },
			{ label: 'Forum', href: 'https://community.transloadit.com/' },
			{ label: 'Blog', to: '/blog' },
			{ label: 'Examples', to: '/examples' },
			{
				label: 'Contributing',
				href: 'https://github.com/transloadit/uppy/blob/main/.github/CONTRIBUTING.md',
			},
		],
	},
	{
		title: 'Uppy + Transloadit',
		links: [
			{ label: 'File processing', href: 'https://transloadit.com/' },
			{
				label: 'Open source support',
				href: 'https://transloadit.com/open-source/support/',
			},
			{ label: 'Transloadit plugin', to: '/docs/transloadit' },
			{ label: 'tus.io', href: 'https://tus.io/' },
		],
	},
];

function Footer() {
	return (
		<footer className={styles.footer}>
			<div className={styles.inner}>
				<div className={styles.brand}>
					<Link to="/" className={styles.lockup}>
						<img src="/img/logo.svg" alt="" width={34} height={34} />
						<span>Uppy</span>
					</Link>
					<p className={styles.pitch}>
						The sleek, modular open source file uploader for the web. MIT
						licensed, and free since 2016.
					</p>
					<Link className={styles.parent} href="https://transloadit.com">
						<span>by</span>
						<img src="/img/transloadit.svg" alt="Transloadit" height={14} />
					</Link>
				</div>

				<nav className={styles.columns}>
					{columns.map((column) => (
						<div key={column.title}>
							<Heading as="h2">{column.title}</Heading>
							<ul>
								{column.links.map((link) => (
									<li key={link.label}>
										<Link to={link.to} href={link.href}>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</nav>
			</div>

			<div className={styles.legal}>
				<p>© 2016–{new Date().getFullYear()} Transloadit</p>
				<p>
					<Link
						href="https://opensource.org/licenses/MIT"
						rel="noreferrer noopener"
						target="_blank"
					>
						MIT License
					</Link>
					<Link to="/privacy-policy/">Privacy Policy</Link>
				</p>
			</div>
		</footer>
	);
}

export default React.memo(Footer);
