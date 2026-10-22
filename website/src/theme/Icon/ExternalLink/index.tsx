import React from 'react';
import { translate } from '@docusaurus/Translate';

import styles from './styles.module.css';

type Props = {
	width?: number;
	height?: number;
};

/**
 * Replaces the theme's boxed-arrow sprite with Lucide's `arrow-up-right`:
 * one stroke weight, same corner language as the rest of the iconography.
 */
export default function IconExternalLink({
	width = 14,
	height = 14,
}: Props): JSX.Element {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={styles.icon}
			aria-label={translate({
				id: 'theme.IconExternalLink.ariaLabel',
				message: '(opens in new tab)',
				description: 'The ARIA label for the external link icon',
			})}
		>
			<path d="M7 17 17 7" />
			<path d="M8 7h9v9" />
		</svg>
	);
}
