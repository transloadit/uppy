# remark-lint-uppy

remark-lint preset derived from [`remark-preset-lint-recommended`][remark-preset-lint-recommended].

Differences:

*   The `list-item-bullet-indent` rule is disabled.
*   The `list-item-indent` rule is disabled.

The reason for the differences is that these "wrong" patterns are ubiquitous in our markdown files and we don't want to do these huge changes after adding the linter.

## License

[MIT][].

[remark-preset-lint-recommended]: https://github.com/remarkjs/remark-lint/blob/master/packages/remark-preset-lint-recommended

[MIT]: ./LICENSE
