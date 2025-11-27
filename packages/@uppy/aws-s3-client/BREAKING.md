# Breaking Changes

This is a comprehensive list of the breaking changes introduced in the major version releases of s3mini library.

## Versions

- [Version v0.4.0](#version-040)
- [Version v0.3.0](#version-030)

## Version 0.4.0

- The `s3mini` class has been renamed to `S3mini` to follow typescript naming conventions. `s3mini` is now an alias for `S3mini` with deprecated usage flag.

## Version 0.3.0

- Response objects now use uppercase property names to match AWS S3 API conventions (except for `etag` which remains lowercase)
  - `key` → `Key`
  - `size` → `Size`
  - `lastModified` → `LastModified`
    - `etag` remains `etag`
