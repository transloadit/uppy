'use strict'

exports.plugins = [
  require('remark-frontmatter'),
  // Do a lint.
  require('remark-lint'),
  // Unix compatibility.
  require('remark-lint-final-newline'),
  // Differs or unsupported across vendors.
  require('remark-lint-no-auto-link-without-protocol'),
  require('remark-lint-no-blockquote-without-marker'),
  require('remark-lint-no-literal-urls'),
  [require('remark-lint-ordered-list-marker-style'), '.'],
  // Mistakes.
  require('remark-lint-hard-break-spaces'),
  require('remark-lint-no-duplicate-definitions'),
  require('remark-lint-no-heading-content-indent'),
  require('remark-lint-no-inline-padding'),
  require('remark-lint-no-shortcut-reference-image'),
  require('remark-lint-no-shortcut-reference-link'),
  require('remark-lint-no-undefined-references'),
  require('remark-lint-no-unused-definitions')
]
