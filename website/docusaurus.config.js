// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer')

/**
 * prism-react-renderer's github theme sets five token colours that miss 4.5:1
 * against the code block's own #f6f8fa ground: properties at 2.58, keywords at
 * 2.68, comments at 2.71, functions at 4.29, strings at 4.32. Every code sample
 * in the docs and the blog is affected, which is most of the site.
 *
 * Same hues, darkened until they clear 4.5:1 on the code block's own ground and
 * on the #dddfe1 a highlighted line sits on. The darker of the two is what sets
 * each value here, so the line-highlight keeps its default strength. The two
 * that already pass (function-variable at 6.1 and the blue tag/selector at
 * 13.2) are untouched.
 *
 * Patched here rather than in CSS because prism-react-renderer writes these as
 * inline styles on each span, which no stylesheet can override without
 * `!important` on every token type.
 */
const accessibleTokenColors = {
  '#999988': '#575f69', // comment, prolog, doctype, cdata
  '#e3116c': '#8a0f4d', // string, attr-value
  '#36acaa': '#16605e', // number, boolean, constant, property, regex…
  '#00a4db': '#00618a', // atrule, keyword, attr-name, selector
  '#d73a49': '#c11a26', // function, deleted, tag
}

const lightCodeTheme = {
  ...themes.github,
  styles: themes.github.styles.map((entry) => {
    const replacement = accessibleTokenColors[entry.style.color]
    return replacement ?
        { ...entry, style: { ...entry.style, color: replacement } }
      : entry
  }),
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Uppy',
  tagline: 'The open source JavaScript file uploader',
  url: 'https://uppy.io',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  favicon: 'img/logo.svg',
  organizationName: 'transloadit', // Usually your GitHub org/user name.
  projectName: 'uppy.io', // Usually your repo name.
  trailingSlash: true,
  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'google-site-verification',
        content: 'JxARoHXoCI8bD07pLV_u3z6xpuWNcSIZIcHEytyCkUc',
      },
    },
    {
      // JSON-LD so agents get Uppy's identity, licence and maintainer as
      // data rather than having to infer them from prose. Every claim here
      // is verifiable from the repo or this site -- nothing asserted that
      // cannot be checked (no ratings, no counts, no dates).
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://transloadit.com/#organization',
            name: 'Transloadit',
            url: 'https://transloadit.com',
            description:
              'Transloadit builds and maintains Uppy, and provides file encoding and processing infrastructure.',
            sameAs: [
              'https://github.com/transloadit',
              'https://community.transloadit.com/',
            ],
          },
          {
            '@type': 'WebSite',
            '@id': 'https://uppy.io/#website',
            url: 'https://uppy.io',
            name: 'Uppy',
            description:
              'Documentation for Uppy, the open source JavaScript file uploader.',
            publisher: { '@id': 'https://transloadit.com/#organization' },
            inLanguage: 'en',
          },
          {
            '@type': 'SoftwareApplication',
            '@id': 'https://uppy.io/#software',
            name: 'Uppy',
            applicationCategory: 'DeveloperApplication',
            description:
              'Uppy is an open source JavaScript file uploader for the browser. It uploads from disk and from remote sources such as Google Drive, Dropbox and OneDrive, resumes interrupted uploads over the tus protocol, and has official bindings for React, Vue, Svelte and Angular.',
            url: 'https://uppy.io',
            downloadUrl: 'https://www.npmjs.com/package/uppy',
            codeRepository: 'https://github.com/transloadit/uppy',
            license: 'https://spdx.org/licenses/MIT.html',
            programmingLanguage: 'JavaScript',
            operatingSystem: 'Any',
            isAccessibleForFree: true,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            author: { '@id': 'https://transloadit.com/#organization' },
            maintainer: { '@id': 'https://transloadit.com/#organization' },
          },
        ],
      }),
    },
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        sitemap: { lastmod: 'datetime' },
        docs: {
          breadcrumbs: false,
          remarkPlugins: [require('./src/remark/comparison-icons.cjs')],
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/transloadit/uppy/blob/main/website/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/transloadit/uppy/tree/main/website/',
          blogSidebarCount: 0,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  plugins: [
    require.resolve('./src/plugins/agent-readiness.js'),
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/docs/react',
            from: [
              '/docs/react/status-bar',
              '/docs/react/drag-drop',
              '/docs/react/file-input',
              '/docs/react/progress-bar',
              '/docs/react/dashboard',
              '/docs/react/dashboard-modal',
            ],
          },
          {
            to: '/docs/status-bar',
            from: ['/docs/statusbar'],
          },
          {
            to: '/docs/xhr-upload',
            from: ['/docs/xhrupload'],
          },
          {
            to: '/docs/google-photos-picker',
            from: ['/docs/google-photos'],
          },
          {
            to: '/docs/guides/migration-guides',
            from: ['/docs/instagram'],
          },
          {
            to: '/docs/transloadit',
            from: ['/docs/robodog'],
          },
          {
            to: '/docs/guides/building-plugins',
            from: ['/docs/writing-plugins'],
          },
        ],
      },
    ],
  ],
  scripts: [
    {
      src: 'https://plausible.io/js/script.js',
      async: true,
      defer: true,
      'data-domain': 'uppy.io',
    },
    { src: 'https://buttons.github.io/buttons.js', async: true, defer: true },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/og_image.jpg',
      metadata: [
        { property: 'og:type', content: 'website' },
        {
          property: 'og:title',
          content: 'Uppy by Transloadit - Open source JavaScript file uploader',
        },
        {
          property: 'og:description',
          content:
            'The open source JavaScript file uploader. Resumable uploads from disk, Dropbox or Google Drive, for React, Next.js, Vue, Svelte and Angular.',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:domain', content: 'uppy.io' },
        {
          name: 'twitter:title',
          content: 'Uppy by Transloadit - Open source JavaScript file uploader',
        },
        {
          name: 'twitter:description',
          content:
            'The open source JavaScript file uploader. Resumable uploads from disk, Dropbox or Google Drive, for React, Next.js, Vue, Svelte and Angular.',
        },
      ],
      docs: { sidebar: { autoCollapseCategories: true } },
      colorMode: { disableSwitch: true },
      navbar: {
        title: 'Uppy',
        logo: {
          alt: 'Uppy Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'quick-start',
            position: 'left',
            label: 'Docs',
          },
          { to: '/examples', label: 'Examples', position: 'left' },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://community.transloadit.com/',
            label: 'Forum',
            position: 'left',
          },
          {
            href: 'https://transloadit.com/open-source/support/',
            label: 'Support',
            position: 'left',
          },
          { type: 'custom-githubStars', position: 'right' },
        ],
      },
      algolia: {
        // The application ID provided by Algolia
        appId: 'Q65IKQHNN5',
        // Public API key: it is safe to commit it
        apiKey: '8a30cf604c46f44f2973f55ed6411586',
        indexName: 'uppy',
      },
      prism: {
        theme: lightCodeTheme,
      },
    }),
}

module.exports = config
