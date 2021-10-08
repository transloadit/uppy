const importDefault = (specifier) =>
  import(specifier).then((module) => module.default)

export default {
  plugins: [
    await importDefault("remark-frontmatter"),
    // Do a lint.
    await importDefault("remark-lint"),
    // Unix compatibility.
    await importDefault("remark-lint-final-newline"),
    // Differs or unsupported across vendors.
    await importDefault("remark-lint-no-auto-link-without-protocol"),
    await importDefault("remark-lint-no-blockquote-without-marker"),
    await importDefault("remark-lint-no-literal-urls"),
    [await importDefault("remark-lint-ordered-list-marker-style"), "."],
    // Mistakes.
    await importDefault("remark-lint-hard-break-spaces"),
    await importDefault("remark-lint-no-duplicate-definitions"),
    await importDefault("remark-lint-no-heading-content-indent"),
    await importDefault("remark-lint-no-inline-padding"),
    await importDefault("remark-lint-no-shortcut-reference-image"),
    await importDefault("remark-lint-no-shortcut-reference-link"),
    await importDefault("remark-lint-no-undefined-references"),
    await importDefault("remark-lint-no-unused-definitions"),
    [await importDefault("remark-lint-emphasis-marker"), '_'],
    await importDefault("remark-lint-strong-marker"),
    await importDefault("./retext-preset.js"),
  ],
}
