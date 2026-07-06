import React from 'react';
import Link from '@docusaurus/Link';

import styles from './index.module.css';

function Footer() {
	return (
		<footer className={styles.footer}>
			<p>
				<img
					className="IndexFooter-logo"
					title="Uppy"
					alt="Uppy"
					src="/img/logo.svg"
				/>
			</p>
			<p>
				Released under the{' '}
				<Link
					href="http://opensource.org/licenses/MIT"
					rel="noreferrer noopener"
					target="_blank"
				>
					MIT License
				</Link>{' '}
				⋅ <Link href="/privacy-policy/">Privacy Policy</Link> ⋅{' '}
				<Link href="https://github.com/transloadit/uppy/blob/main/.github/CONTRIBUTING.md">
					Contributing
				</Link>
			</p>
			<p>
				© 2016-{new Date().getFullYear()}{' '}
				<Link href="https://transloadit.com" target="_blank">
					Transloadit
				</Link>
			</p>
		</footer>
	);
}

export default React.memo(Footer);
