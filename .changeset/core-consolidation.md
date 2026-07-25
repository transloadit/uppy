---
"@uppy/core": major
---

`@uppy/utils`, `@uppy/store-default`, `@uppy/companion-client` and `@uppy/provider-views`
have been merged into `@uppy/core` and are no longer published to npm
([#6370](https://github.com/transloadit/uppy/pull/6370)). They are now available as
subpath exports:

| Removed package          | New import                    |
| ------------------------ | ----------------------------- |
| `@uppy/utils`            | `@uppy/core/utils`            |
| `@uppy/store-default`    | `@uppy/core/store-default`    |
| `@uppy/companion-client` | `@uppy/core/companion-client` |
| `@uppy/provider-views`   | `@uppy/core/provider-views`   |

Remove them from your `package.json` — every plugin already depends on `@uppy/core`, so
there is now a single source of truth instead of a sub-dependency that could be pinned to
an older copy in your lockfile.

Also breaking:

- Provider CSS moved: `@uppy/provider-views/css/style.min.css` →
  `@uppy/core/provider-views/css/style.min.css`. Most apps don't import this directly —
  it ships bundled in `@uppy/dashboard`'s CSS.
- `RequestOptions` moved from `@uppy/utils` to `@uppy/core/companion-client`.
- `CompanionClientProvider` and `CompanionClientSearchProvider` are removed. They were
  hand-maintained stand-ins that existed only because `@uppy/utils` could not see the
  real provider classes. Import `Provider` from `@uppy/core/companion-client` instead.

Nothing changes if you use the `uppy` meta-package or the CDN bundle — the re-exports
were repointed to the new subpaths internally.
