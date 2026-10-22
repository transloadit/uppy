import React from 'react';

import CopyStateIcon from '../CopyStateIcon';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import styles from './styles.module.css';

type Props = {
	command: string;
	className?: string;
};

export default function InstallCommand({
	command,
	className,
}: Props): JSX.Element {
	const { copied, copy } = useCopyToClipboard(command);

	return (
		<div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
			<code className={styles.command}>
				<span className={styles.prompt} aria-hidden>
					$
				</span>
				{command}
			</code>
			<button
				type="button"
				className={styles.copy}
				onClick={copy}
				aria-label={copied ? 'Copied' : `Copy "${command}" to clipboard`}
			>
				<CopyStateIcon copied={copied} />
			</button>
		</div>
	);
}
