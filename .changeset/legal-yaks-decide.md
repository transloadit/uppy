---
"@uppy/utils": major
---

Updated export maps for @uppy/utils: removed nested subpath exports; all utilities are now exported from the root index.js.


**Before :**

```typescript

import getFileTypeExtension from '@uppy/utils/lib/getFileTypeExtension'

```

**After :**

```typescript

import { getFileTypeExtension } from '@uppy/utils'

```
