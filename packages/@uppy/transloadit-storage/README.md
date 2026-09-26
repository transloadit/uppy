# `@uppy/transloadit-storage`

> [!WARNING]
> Experimental. This plugin, `@uppy/s3` and the Companion endpoints they use will change
> incompatibly, also in minor releases, as they make way for a standalone file manager.

Browse a Workspace's Storage through an authenticated Companion grant, and upload into the open
directory with `@uppy/transloadit`. Keep grants, Assembly signing and Smart CDN signing on your
application server; browser-provided paths are not authorization.

In the Dashboard the plugin is a picker by default: files can be browsed and picked, and, with
`storeUploads` or `onUploadRequest`, uploaded into the open folder (also by dropping them on the
panel). Renaming, moving, deleting and new folders need `mode: 'manager'` (the default with
`standalone`), a stopgap until a dedicated file manager plugin.

## Upload results are the durable handoff

`storeUploads` and `buildStoreAssemblyParams()` default to `conflictStrategy: 'error'`.
Choose `'rename'` to allocate a free name or `'overwrite'` to create a new version deliberately.
Ordinary non-Storage uploads are unchanged.

An upload batch shares one Assembly. With the default `'error'`, one collision can fail the
Assembly and make completion tracking report every file as failed. This is not a transaction:
files stored before the failure may already exist. Inspect the Assembly before retrying. Choose
`'rename'` when ordinary filename collisions should not abort a multi-file upload.

After `ASSEMBLY_COMPLETED`, save the canonical stored result from `results[producingStep][i]`
with your application's owner/project record. A store step annotating `:original` reports in
`results[':original']`, not necessarily under the name `stored`. Verify the completed Assembly
server-side; do not trust a browser-supplied receipt. Uppy preserves the returned result fields.

Save `workspace`, `asset_id`, `version_id`, the **returned** `path`, `size`, `mime`, available
checksums and image dimensions. Explicit collision renaming can change the requested filename.
The native catalog API and `@transloadit/node`'s `getStoredAsset()` return that same record.
`getStoredAssemblyResults({ assemblyId, workspace })` fetches and validates all stored results,
including video, audio and documents, with their Assembly/step/result/input provenance. First bind
the Assembly to the authenticated application's upload record. Register idempotently by
Assembly/step/result ID (or asset/version), not by filename or webhook count.
`getStoredImageReceipt()` additionally verifies trusted upload metadata for image rendering.

## Location, identity and bytes

- `path` reads the current asset at that location. Renames make old paths stale.
- `asset_id` follows the logical asset and selects its current version.
- `asset_id` plus `version_id` selects exact retained bytes, without falling back after overwrite.

Identity survives a **native catalog move or rename**. This plugin uses Companion's separate
`transloadit-storage` provider: file and folder moves call the native catalog endpoint, preserving
retained references. If that endpoint or its Workspace credentials are unavailable, the action
fails; it never falls back to copy/delete. The generic `@uppy/s3` provider keeps S3 copy/delete
semantics, which create a new asset rather than preserving identity.

Generic S3 moves require conditional copy/delete support and source ETags. Destination writes
must not overwrite, and source deletion must still match the copied object. A folder move there is
driven from the browser, file by file, and is not one transaction: a conflict can leave copied
destinations, so inspect both paths before retrying. Objects above the 5 GB single-copy limit are
refused before starting mutations; use an S3 client with multipart copy for those. These limits do
not apply to native Storage catalog moves.

Use those exclusive selectors with `/transloadit/import` in the same authenticated Workspace.
Deleting an asset or removing its retained version makes the reference unavailable. IDs are not
authorization or a backup. Keep permissions attached to stable asset identity where possible.

`getSmartCdnUrl(key)` receives the current browser listing's **path**, not an asset/version ID.
Its server endpoint must authorize the user and resolve the selected path through a bounded
native catalog query (`listStoredAssets({ prefix: key, limit: 1 })`, checking exact returned path).
Then build delivery from the returned receipt. Do not insert the mutable key or its hash into a
version-pinned Built-in. `@transloadit/viewer` uses the asset ID as input and version ID as `v`.
Current public-prefix policy still controls uncached public delivery of historical versions.

`getDownloadUrl(key)` follows the same application authorization and exact-path resolution, then
returns `client.getStoredAssetUrl(asset, { download: true })` from the Node SDK. This selects the
exact original version and a safe attachment filename. Downloads navigate directly to that URL;
the widget does not buffer the file in a browser Blob. Read-only users may download or copy links
when those callbacks are configured. Preview, browser-compatible playback and original download
are separate decisions; an original video URL does not transcode unsupported codecs.

## Companion configuration

Configure the provider under `providerOptions['transloadit-storage']`: everything the S3 provider
takes (`S3ProviderOptions`, minus the bucket, prefix and credential fields it does not use), plus
`apiEndpoint` and a credential pair for every Workspace you serve. Grants only: a grant names the
Workspace (as its bucket), the prefix the user may see and whether they may write, and Companion
holds the credentials — a grant never carries them, and there is no bucket form to fall back on.
Verify grants with `grantSecret` (HMAC) or, preferably, `grantPublicKey`. The same key pair signs
S3 requests and native catalog calls (SHA-256, matching the combined Storage/Smart CDN key). Keys
and the grant secret stay on the server.

```ts
const companionOptions = {
  providerOptions: {
    'transloadit-storage': {
      endpoint: storageS3Endpoint,
      region: 'auto',
      grantPublicKey,
      apiEndpoint: 'https://api2.transloadit.com',
      workspaces: {
        'my-workspace': { key: workspaceKey, secret: workspaceSecret },
      },
    },
  },
}
```

These are Companion server options, not browser plugin options. Your hosted Companion must deploy
this provider and configure the Workspace map before enabling it. A single static S3 key cannot
serve arbitrary Workspaces. Prefix checks, expired-session checks and write scopes are enforced
server-side for both source and destination.

The browser never names a bucket: `@uppy/s3` and this plugin have no `bucket` option, and the
session sees whatever Companion (or the grant) decides. Each listing carries a `session` object:
the `bucket`, the session's root `prefix`, `canWrite`, and whether the server moves folders itself
(`supportsMoveFolder`, true for this provider); the browser hides the file changes and uploads when the
server says the session is read-only, and resolves paths typed into the move dialogs relative to
that browsing root. Older servers that report no session show read actions only — upgrade
Companion together with this plugin.

Queued imports include their original bucket in the download URL. Companion refuses a missing
or different bucket before reading any bytes, so reconnecting cannot silently import a same-named
file from another Workspace. Upgrade Companion and the browser package together; older queued
imports need to be selected again.

A folder moves as one native operation on this provider. On the generic `@uppy/s3` provider
Companion moves one file at a time, so the browser walks the folder and moves its files itself,
behind a progress screen with a Stop button; a multi-selection is a sequence either way, so
partial failures refresh the listing before a retry. Generic S3 moves need no configuration: they
are always available and use conditional copy/delete headers (`If-None-Match`, `CopySourceIfMatch`,
`If-Match`) where the endpoint supports them.

## Upload configuration

`storeUploads.transloaditPluginId` selects the installed `@uppy/transloadit` plugin (default:
`Transloadit`). The convenience option configures only a plugin without `assemblyOptions` and
preserves its locale overrides, and enables `waitForEncoding` so completion includes the Storage
Step and reports its failures. If your application already owns an Assembly pipeline, call
`createStoreAssemblyOptions(uppy, { signAssembly, storagePluginId })` explicitly and compose it
deliberately; the widget will not overwrite that pipeline. Uploads at the browsing root use the
authenticated grant's prefix, initializing the session first even if the panel has not been opened.
An authentication failure stops the upload before requesting a signature. `onUploadRequest` can
also expose an app-owned upload flow without enabling `storeUploads`.
Your signing endpoint must independently authorize that destination
and restrict the allowed Steps; client-side folder selection is not an authorization boundary.

This contract requires the matching API2 catalog/Built-in deployment and SDK/types release before
production rollout. `@transloadit/viewer` is an unpublished private preview, not yet an npm install;
maintainers can follow the [local packing and devdock guide](https://github.com/transloadit/node-sdk/blob/img-onboard/docs/img-dogfood.md).
Companion's S3 listing protocol remains path-based; this package does not
invent Storage IDs for arbitrary S3 providers or fetch metadata for every listed file.
