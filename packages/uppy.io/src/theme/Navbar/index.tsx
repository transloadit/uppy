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
			<p className={styles.header}>
				<Link to="/blog/uppy-5.0">
					Uppy 5.0 is here with headless components and hooks
				</Link>
			</p>
			<Navbar {...props} />
		</>
	);
}
