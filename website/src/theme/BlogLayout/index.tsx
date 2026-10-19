import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';
import type { Props } from '@theme/BlogLayout';

/**
 * Upstream renders the table-of-contents column as a bare `<div class="col
 * col--2">` beside <main>, so on every blog post that column is page content
 * belonging to no landmark — landmark navigation goes straight from the post to
 * the footer, and the "skip to content" path never reaches it. The docs layout
 * doesn't have the problem because its TOC sits inside <main>.
 *
 * The only change from upstream is that div becoming a labelled <aside>. Moving
 * the TOC inside <main> would have been the other fix, but that changes the grid
 * the blog is laid out on; this keeps the layout identical.
 *
 * If a Docusaurus upgrade changes BlogLayout, re-sync this file against
 * node_modules/@docusaurus/theme-classic/lib/theme/BlogLayout/index.js.
 */
export default function BlogLayout(props: Props): JSX.Element {
	const { sidebar, toc, children, ...layoutProps } = props;
	const hasSidebar = sidebar && sidebar.items.length > 0;

	return (
		<Layout {...layoutProps}>
			<div className="container margin-vert--lg">
				<div className="row">
					<BlogSidebar sidebar={sidebar} />
					<main
						className={clsx('col', {
							'col--7': hasSidebar,
							'col--9 col--offset-1': !hasSidebar,
						})}
					>
						{children}
					</main>
					{toc && (
						<aside className="col col--2" aria-label="Table of contents">
							{toc}
						</aside>
					)}
				</div>
			</div>
		</Layout>
	);
}
