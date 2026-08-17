---
'@uppy/companion': minor
---

Allow per-provider OAuth `scope` and `customParams` to be configured via `providerOptions`.

Until now, OAuth scopes were hardcoded in `@uppy/companion`'s grant config (e.g. `Files.Read.All` for OneDrive, `drive.readonly` for Google Drive, `email user_photos` for Facebook), forcing operators with stricter consent-screen requirements to fork or patch `node_modules`. This change introduces two optional fields on each per-provider entry of `providerOptions`:

- `scope: string[]` — replaces the default OAuth scope for the provider. Applied after `getExtraGrantConfig()`, so it also overrides scopes set by provider classes.
- `customParams: Record<string, string>` — shallow-merged onto the provider's default `custom_params` (e.g. Google's `access_type: 'offline'`).

Defaults are unchanged. Operators are responsible for verifying that any narrowed scope still satisfies the listing/download paths their integration uses (e.g. Google Drive's picker requires `drive.readonly`; narrowing to `drive.file` returns an empty listing).
