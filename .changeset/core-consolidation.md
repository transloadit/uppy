---
"@uppy/core": major
---

`@uppy/utils`, `@uppy/store-default`, `@uppy/companion-client` and `@uppy/provider-views`
have been merged into `@uppy/core`
([#6370](https://github.com/transloadit/uppy/pull/6370)). No new versions of them will be
published: their existing releases stay on npm but are deprecated in favour of the
`@uppy/core` subpaths.

| Removed package          | New import                    |
| ------------------------ | ----------------------------- |
| `@uppy/utils`            | `@uppy/core/utils`            |
| `@uppy/store-default`    | `@uppy/core/store-default`    |
| `@uppy/companion-client` | `@uppy/core/companion-client` |
| `@uppy/provider-views`   | `@uppy/core/provider-views`   |

Remove them from your `package.json` — every Uppy plugin already depends on `@uppy/core`, so
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

Through the `uppy` meta-package or the CDN bundle, nothing changes: `server`
(companion-client), `views.ProviderView` and `DefaultStore` keep their names and are
repointed at the `@uppy/core` subpaths internally. Only direct imports of the four
packages need the table above.
