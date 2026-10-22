import React from 'react';
import Link from '@docusaurus/Link';

import styles from './index.module.css';

/**
 * Brand lockup: Uppy owns the mark, Transloadit is named right beside it so the
 * relationship (and the path to transloadit.com) is legible at a glance.
 *
 * The two halves are separate links, so this can't be a single wrapping anchor.
 */
export default function NavbarLogo(): JSX.Element {
	return (
		<div className={styles.lockup}>
			<Link to="/" className={styles.uppy} aria-label="Uppy, home">
				<img src="/img/logo.svg" alt="" width={30} height={30} />
				<span>Uppy</span>
			</Link>

			<span className={styles.divider} aria-hidden />

			<Link
				href="https://transloadit.com"
				className={styles.transloadit}
				title="Uppy is built and maintained by Transloadit"
			>
				<span className={styles.by}>by</span>
				<img src="/img/transloadit.svg" alt="Transloadit" height={17} />
			</Link>
		</div>
	);
}
