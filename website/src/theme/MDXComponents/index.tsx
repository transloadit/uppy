import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';

/**
 * GitHub-flavoured task lists (`- [x] done`) render as bare disabled
 * checkboxes with no label of any kind, so a screen reader reaches an unnamed
 * form control and the tick — the only thing carrying done-vs-not — is
 * announced as nothing at all.
 *
 * The item's own text sits beside the input rather than in a <label>, and it
 * isn't reachable from here, so the state is named instead of the task: the
 * text is read out anyway as the list item's content.
 *
 * Only task-list checkboxes are touched. Any other input written into MDX keeps
 * whatever attributes it was given.
 */
function MDXInput(props: React.ComponentProps<'input'>): JSX.Element {
	const isTaskListCheckbox =
		props.type === 'checkbox' &&
		props.disabled &&
		props['aria-label'] === undefined;

	if (!isTaskListCheckbox) return <input {...props} />;

	return <input {...props} aria-label={props.checked ? 'Done' : 'Not done'} />;
}

export default {
	...MDXComponents,
	input: MDXInput,
};
