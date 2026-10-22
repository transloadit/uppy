import React from 'react';
import clsx from 'clsx';
import {
	PageMetadata,
	HtmlClassNameProvider,
	ThemeClassNames,
} from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import BlogPostItems from '@theme/BlogPostItems';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import Heading from '@theme/Heading';
import type { Props } from '@theme/BlogListPage';

import styles from './index.module.css';

/**
 * Upstream's BlogListPage renders no h1 — the post titles are h2s and nothing
 * heads the page, so a screen reader landing here gets a list of articles with
 * no statement of what the list is, and heading navigation has nothing to jump
 * to. This is a copy of upstream with that one heading added; it is a copy
 * rather than a wrapper because the heading has to sit inside BlogLayout's
 * <main>, which a wrapper can't reach.
 *
 * Kept visually hidden: the redesign heads this page with the post list itself,
 * and a visible title would be a design change rather than an access fix.
 *
 * If a Docusaurus upgrade changes BlogListPage, re-sync this file against
 * node_modules/@docusaurus/theme-classic/lib/theme/BlogListPage/index.js.
 */
function BlogListPageMetadata(props: Props): JSX.Element {
	const { metadata } = props;
	const {
		siteConfig: { title: siteTitle },
	} = useDocusaurusContext();
	const { blogDescription, blogTitle, permalink } = metadata;
	const isBlogOnlyMode = permalink === '/';
	const title = isBlogOnlyMode ? siteTitle : blogTitle;
	return (
		<>
			<PageMetadata title={title} description={blogDescription} />
			<SearchMetadata tag="blog_posts_list" />
		</>
	);
}

function BlogListPageContent(props: Props): JSX.Element {
	const { metadata, items, sidebar } = props;
	return (
		<BlogLayout sidebar={sidebar}>
			<Heading as="h1" className={styles.srOnly}>
				{metadata.blogTitle}
			</Heading>
			<BlogPostItems items={items} />
			<BlogListPaginator metadata={metadata} />
		</BlogLayout>
	);
}

export default function BlogListPage(props: Props): JSX.Element {
	return (
		<HtmlClassNameProvider
			className={clsx(
				ThemeClassNames.wrapper.blogPages,
				ThemeClassNames.page.blogListPage,
			)}
		>
			<BlogListPageMetadata {...props} />
			<BlogListPageStructuredData {...props} />
			<BlogListPageContent {...props} />
		</HtmlClassNameProvider>
	);
}
