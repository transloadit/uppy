import React from 'react';
import Navbar from '@theme-original/Navbar';
import type NavbarType from '@theme/Navbar';
import type { WrapperProps } from '@docusaurus/types';
import Link from '@docusaurus/Link';

import styles from './index.module.css';

type Props = WrapperProps<typeof NavbarType>;

export default function NavbarWrapper(props: Props): JSX.Element {
	return (
		<>
			{/* A landmark rather than a bare div: the bar sits above the navbar, so
			    outside one it is page content belonging to no region at all, and
			    landmark navigation jumps over it. */}
			<aside className={styles.banner} aria-label="Announcement">
				<Link to="/blog/uppy-6.0" className={styles.link}>
					<span className={styles.tag}>6.0</span>
					<span className={styles.text}>
						Fewer moving parts and a rewritten S3 plugin
					</span>
					<span className={styles.arrow} aria-hidden>
						→
					</span>
				</Link>
			</aside>
			<Navbar {...props} />
		</>
	);
}
