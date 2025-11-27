# Changelog

## [0.4.0] - 2025-07-01

### Changed

- Renamed `s3mini` class to `S3mini` to follow TypeScript naming conventions.
- `s3mini` is now an alias for `S3mini` with deprecated usage flag.
- Updated all references in the codebase to use `S3mini` instead of `s3mini`.
- Fixed Minio health check and its docker image. (Thanks @ScArLeXiA)

### Added

- Added `ListObject` interface type for better type safety in list operations.
- Added `CHANGELOG.md` to track changes and `BREAKING.md` for breaking changes.
- Added SSE-C support for server-side encryption with customer-provided keys. (Tested on Cloudflare only!)

### Fixed

- Fixed `getEtag` method to properly handle conditional requests and return `null` when no ETag is present.

## [0.3.0] - 2025-06-22

### Changed

- Response objects now use uppercase property names to match AWS S3 API conventions (except for `etag` which remains lowercase)
- `key` → `Key`
- `size` → `Size`
- `lastModified` → `LastModified`
- `etag` remains `etag`

More: [https://github.com/good-lly/s3mini/releases/tag/v0.3.0](https://github.com/good-lly/s3mini/releases/tag/v0.3.0)
