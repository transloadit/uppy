import { useEffect, useRef, useState } from 'react';

/**
 * Copy text and report it for a beat, so a button can acknowledge the click.
 *
 * A failed write leaves `copied` false rather than lying about it: an insecure
 * context or a denied permission is the usual cause, and both mean nothing
 * reached the clipboard.
 */
export function useCopyToClipboard(text: string, resetAfter = 2000) {
	const [copied, setCopied] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => () => clearTimeout(timer.current), []);

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			return;
		}
		setCopied(true);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setCopied(false), resetAfter);
	}

	return { copied, copy };
}
