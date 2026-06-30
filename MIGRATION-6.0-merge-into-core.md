# Migration: packages merged into `@uppy/core` (6.0)

In Uppy 6.0, four packages were folded into `@uppy/core` and are now exposed through
subpath exports. The standalone packages are **removed from npm**. This eliminates a
class of duplicate-version bugs (every plugin already depends on `@uppy/core`, so there
is now a single source of truth) and lets co-dependent types reference each other
directly instead of through hand-maintained duplicates.

## 1. Import paths

Update imports from the removed packages to the matching `@uppy/core` subpath:

| Removed package          | New import                     |
| ------------------------ | ------------------------------ |
| `@uppy/utils`            | `@uppy/core/utils`             |
| `@uppy/store-default`    | `@uppy/core/store-default`     |
| `@uppy/companion-client` | `@uppy/core/companion-client`  |
| `@uppy/provider-views`   | `@uppy/core/provider-views`    |

```diff
- import { fetcher } from '@uppy/utils'
+ import { fetcher } from '@uppy/core/utils'

- import { RequestClient } from '@uppy/companion-client'
+ import { RequestClient } from '@uppy/core/companion-client'
```

Then:

1. Remove `@uppy/utils`, `@uppy/store-default`, `@uppy/companion-client`, and
   `@uppy/provider-views` from your `package.json`.
2. Make sure `@uppy/core` is listed as a dependency (it already is for any plugin).

## 2. CSS

The provider UI styles moved with the code:

| Old                                      | New                                            |
| ---------------------------------------- | ---------------------------------------------- |
| `@uppy/provider-views/css/style.min.css` | `@uppy/core/provider-views/css/style.min.css`  |
| `@uppy/provider-views/css/style.css`     | `@uppy/core/provider-views/css/style.css`      |

> Most apps don't import this directly — it ships bundled in `@uppy/dashboard`'s CSS.
> Only update it if you were importing the provider-views stylesheet explicitly.

## 3. TypeScript types

- **`RequestOptions`** moved from `@uppy/utils` to `@uppy/core/companion-client`
  (it is the companion request type and now lives next to `RequestClient`).

  ```diff
  - import type { RequestOptions } from '@uppy/utils'
  + import type { RequestOptions } from '@uppy/core/companion-client'
  ```

- **`CompanionClientProvider` / `CompanionClientSearchProvider`** are **removed**. They
  were hand-maintained stand-ins that only existed because `@uppy/utils` couldn't see
  the real provider classes. Now that everything lives in `@uppy/core`, the real classes
  are used directly. If you typed against them, import the real class from
  `@uppy/core/companion-client` instead (or `Pick` the members you need):

  ```diff
  - import type { CompanionClientProvider } from '@uppy/utils'
  + import type Provider from '@uppy/core/companion-client'
  - const p: CompanionClientProvider = ...
  + const p: Provider<MyMeta, MyBody> = ...
  ```

  Note: `UnknownProviderPlugin['provider']` is now typed as a structural subset of
  `Provider` (via `Pick`), so a custom provider that matches the public surface still
  fits without subclassing the exact class.

## 4. The `uppy` all-in-one package — no change

If you use the meta-package or the CDN bundle, nothing changes:

```js
import { Uppy, Dashboard, DefaultStore } from 'uppy' // still works
// window.Uppy.DefaultStore — still works
```

These re-exports were repointed to the new `@uppy/core` subpaths internally.
