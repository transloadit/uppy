# `@uppy/transloadit-storage`

Browse and manage a Workspace's Storage through an authenticated Companion grant, and upload
into the open directory with `@uppy/transloadit`. Keep grants, Assembly signing and Smart CDN
signing on your application server; browser-provided paths are not authorization.

## Upload results are the durable handoff

`storeUploads` and `buildStoreAssemblyParams()` default to `conflictStrategy: 'error'`.
Choose `'rename'` to allocate a free name or `'overwrite'` to create a new version deliberately.
Ordinary non-Storage uploads are unchanged.

After `ASSEMBLY_COMPLETED`, save the canonical stored result from `results[producingStep][i]`
with your application's owner/project record. A store step annotating `:original` reports in
`results[':original']`, not necessarily under the name `stored`. Verify the completed Assembly
server-side; do not trust a browser-supplied receipt. Uppy preserves the returned result fields.

Save `workspace`, `asset_id`, `version_id`, the **returned** `path`, `size`, `mime`, available
checksums and image dimensions. Explicit collision renaming can change the requested filename.
The native catalog API and `@transloadit/node`'s `getStoredAsset()` return that same record.
`getStoredImageReceipt()` additionally verifies trusted upload metadata for image rendering.

## Location, identity and bytes

- `path` reads the current asset at that location. Renames make old paths stale.
- `asset_id` follows the logical asset and selects its current version.
- `asset_id` plus `version_id` selects exact retained bytes, without falling back after overwrite.

Use those exclusive selectors with `/transloadit/import` in the same authenticated Workspace.
Deleting an asset or removing its retained version makes the reference unavailable. IDs are not
authorization or a backup. Keep permissions attached to stable asset identity where possible.

`getSmartCdnUrl(key)` receives the current browser listing's **path**, not an asset/version ID.
Its server endpoint must authorize the user and resolve the selected path through a bounded
native catalog query (`listStoredAssets({ prefix: key, limit: 1 })`, checking exact returned path).
Then build delivery from the returned receipt. Do not insert the mutable key or its hash into a
version-pinned Built-in. `@transloadit/viewer` uses the asset ID as input and version ID as `v`.
Current public-prefix policy still controls uncached public delivery of historical versions.

This contract requires the matching API2 catalog/Built-in deployment and SDK/types release before
production rollout. Companion's S3 listing protocol remains path-based; this package does not
invent Storage IDs for arbitrary S3 providers or fetch metadata for every listed file.
