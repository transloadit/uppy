import React from 'react';

import CopyStateIcon from '../CopyStateIcon';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { agentPrompt } from './prompt';
import styles from './styles.module.css';

type Props = {
	className?: string;
};

/**
 * The prompt is long by design — it is a brief, not a snippet — so the panel
 * shows the opening few lines, fades out, and scrolls. Nobody reads this on the
 * page; they copy it into an agent. The copy button always takes the whole
 * thing, whatever is scrolled into view.
 */
export default function AgentPrompt({ className }: Props): JSX.Element {
	const { copied, copy } = useCopyToClipboard(agentPrompt);

	return (
		<div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
			{/* Focusable so the panel can be scrolled from the keyboard. */}
			<pre
				className={styles.prompt}
				tabIndex={0}
				role="group"
				aria-label="Prompt for adding Uppy with a coding agent"
			>
				{agentPrompt}
			</pre>

			{/* The label holds still and only the icon acknowledges the click, so the
			    button doesn't change width under the cursor. */}
			<button type="button" className={styles.copy} onClick={copy}>
				<CopyStateIcon copied={copied} className={styles.icon} />
				Copy prompt
			</button>

			{/* The visible label can't announce the result, so this does. */}
			<span className={styles.status} role="status">
				{copied ? 'Prompt copied to clipboard' : ''}
			</span>
		</div>
	);
}
