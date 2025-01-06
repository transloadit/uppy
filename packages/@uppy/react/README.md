# @uppy/react

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/react.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/react)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

React component wrappers around Uppy’s officially maintained UI plugins.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

<!-- eslint-disable react/state-in-constructor -->

```jsx
/** @jsx React */
import React from 'react'
import Uppy from '@uppy/core'
import { DashboardModal } from '@uppy/react'

const uppy = new Uppy()

class Example extends React.Component {
  state = { open: false }

  render() {
    const { open } = this.state
    return (
      <DashboardModal
        uppy={uppy}
        open={open}
        onRequestClose={this.handleClose}
      />
    )
  }
  // ..snip..
}
```

## Installation

```bash
$ npm install @uppy/react
```

Alternatively, you can also use this plugin in a pre-built bundle from
Transloadit’s CDN: Smart CDN. In that case `Uppy` will attach itself to the
global `window.Uppy` object. See the
[main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/react).

## License

[The MIT License](./LICENSE).
