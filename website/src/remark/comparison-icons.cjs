/**
 * The comparison tables are authored as plain text — `✅`, `x`, `?` — which is
 * the right thing for whoever edits the markdown, but emoji render as clunky
 * multi-colour glyphs that differ per platform and refuse to take a colour.
 * This swaps the markers for spans the stylesheet draws as icons, so the source
 * stays readable and the table gets one consistent icon set.
 *
 * Only text inside table cells is touched, and only when a marker opens the
 * cell, so prose that happens to contain "x" or "?" is left alone.
 */

/** U+FE0F, which trails the emoji markers and would break an equality check. */
const VARIATION_SELECTOR = /️/g;

const MARKERS = [
	['✅', { variant: 'yes', label: 'Yes' }],
	['☑️', { variant: 'partial', label: 'Partial' }],
	['⚠️', { variant: 'warning', label: 'Warning' }],
	['x', { variant: 'no', label: 'No' }],
	['?', { variant: 'unknown', label: 'Unknown' }],
].map(([marker, meta]) => [marker.replace(VARIATION_SELECTOR, ''), meta]);

function iconNode({ variant, label }) {
	return {
		type: 'mdxJsxTextElement',
		name: 'span',
		attributes: [
			{
				type: 'mdxJsxAttribute',
				name: 'className',
				value: `cmp-icon cmp-icon--${variant}`,
			},
			{ type: 'mdxJsxAttribute', name: 'role', value: 'img' },
			{ type: 'mdxJsxAttribute', name: 'aria-label', value: label },
		],
		children: [],
	};
}

/**
 * A marker either fills the cell ("x") or leads it ("⚠️ Broken 2025-08",
 * "✅ ¹"), in which case the trailing text is kept as-is.
 */
function splitMarker(value) {
	const text = value.replace(VARIATION_SELECTOR, '');

	for (const [marker, meta] of MARKERS) {
		if (text === marker) return { meta, rest: '' };
		if (text.startsWith(`${marker} `)) {
			return { meta, rest: text.slice(marker.length) };
		}
	}

	return null;
}

/**
 * Markers sit either directly in the cell or inside a link wrapping it
 * ("[✅](/docs/tus/)"), so this recurses — but a marker only counts as one when
 * it is the first thing in its parent.
 */
function replaceMarkers(node) {
	if (!Array.isArray(node.children)) return;

	node.children = node.children.flatMap((child, index) => {
		if (child.type === 'text' && index === 0) {
			const hit = splitMarker(child.value);

			if (hit) {
				const icon = iconNode(hit.meta);
				return hit.rest ? [icon, { type: 'text', value: hit.rest }] : [icon];
			}
		}

		replaceMarkers(child);
		return [child];
	});
}

module.exports = function comparisonIcons() {
	return (tree) => {
		const visit = (node) => {
			if (node.type === 'tableCell') {
				replaceMarkers(node);
				return;
			}

			for (const child of node.children ?? []) visit(child);
		};

		visit(tree);
	};
};
