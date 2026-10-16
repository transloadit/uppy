import React from 'react';

type Props = {
	copied: boolean;
	className?: string;
};

/**
 * The two halves of a copy button's feedback. Both glyphs are drawn in the same
 * 16-unit box so swapping one for the other can't shift what sits beside it.
 */
export default function CopyStateIcon({ copied, className }: Props) {
	return copied ?
			<svg className={className} viewBox="0 0 16 16" aria-hidden>
				<path
					d="M13 4.5 6.5 11.5 3 8"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		:	<svg className={className} viewBox="0 0 16 16" aria-hidden>
				<rect
					x="5.75"
					y="5.75"
					width="8.5"
					height="8.5"
					rx="2"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
				/>
				<path
					d="M10.25 3.75a2 2 0 0 0-2-2h-4.5a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</svg>;
}
