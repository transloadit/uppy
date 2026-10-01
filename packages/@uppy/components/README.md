# @uppy/components

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/components.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/components)

Headless Uppy components, such as `Dropzone`, `FilesList` and `FilesGrid`, and
the controllers behind hooks like `useDropzone`. Use them to build your own
upload UI instead of the Dashboard.

You normally don't install this package yourself. The framework packages,
[`@uppy/react`](https://www.npmjs.com/package/@uppy/react),
[`@uppy/vue`](https://www.npmjs.com/package/@uppy/vue) and
[`@uppy/svelte`](https://www.npmjs.com/package/@uppy/svelte), depend on it and
expose its components and hooks in their own idiom.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

With React:

```jsx
import { useState } from 'react'
import Uppy from '@uppy/core'
import { Dropzone, FilesList, UploadButton, UppyContextProvider } from '@uppy/react'

function Uploader() {
  const [uppy] = useState(() => new Uppy())
  return (
    <UppyContextProvider uppy={uppy}>
      <Dropzone />
      <FilesList />
      <UploadButton />
    </UppyContextProvider>
  )
}
```

## Documentation

The components and hooks are documented with each framework:
[React](https://uppy.io/docs/react), [Vue](https://uppy.io/docs/vue) and
[Svelte](https://uppy.io/docs/svelte).

## License

[The MIT License](https://github.com/transloadit/uppy/blob/main/LICENSE).
