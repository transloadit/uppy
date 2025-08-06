# @uppy/companion-client

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/companion-client.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/companion-client)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/CI/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

Client library for communication with Companion. Intended for use in Uppy
plugins.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com),
a versatile file encoding service.

## Example

```js
import Uppy from '@uppy/core'
import { Provider, RequestClient, Socket } from '@uppy/companion-client'

const uppy = new Uppy()

const client = new RequestClient(uppy, {
  companionUrl: 'https://uppy.mywebsite.com/',
})
client.get('/drive/list').then(() => {})

const provider = new Provider(uppy, {
  companionUrl: 'https://uppy.mywebsite.com/',
  provider: providerPluginInstance,
})
provider.checkAuth().then(() => {})

const socket = new Socket({ target: 'wss://uppy.mywebsite.com/' })
socket.on('progress', () => {})
```

## Installation

> Unless you are writing a custom provider plugin, you do not need to install
> this.

```bash
$ npm install @uppy/companion-client
```

## Documentation

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/companion).

## License

[The MIT License](./LICENSE).
