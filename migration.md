### `@uppy/informer`

- **Breaking:** `@uppy/informer` is no longer available as a standalone plugin. The Informer functionality is now built into `@uppy/dashboard` by default.
- **Migration:** Remove any separate `@uppy/informer` imports and `.use()` calls. Informer is automatically included when using Dashboard.
- **Control:** Use the `disableInformer: true` option in Dashboard to hide informer notifications if needed.

**Before:**
```js
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Informer from '@uppy/informer'

const uppy = new Uppy()
  .use(Dashboard, { target: '#uppy' })
  .use(Informer, { target: '#uppy-informer' })
```

**After:**
```js
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'

const uppy = new Uppy()
  .use(Dashboard, {
    target: '#uppy',
    // Informer is included by default
    // Use disableInformer: true to disable it
  })
```

