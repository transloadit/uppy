---
"@uppy/core": minor
"@uppy/dashboard": patch
"@uppy/status-bar": patch
"@uppy/url": patch
"@uppy/aws-s3": patch
"@uppy/s3": patch
"@uppy/companion": patch
---

Drop four small dependencies: `mime-match`, `classnames`, `nanoid` and `type-fest`. `@uppy/core` now has its own equivalents with the same behaviour, and exports `classNames`, `nanoid` and the `Promisable` type from `@uppy/core/utils`.
