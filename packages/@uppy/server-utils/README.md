# @uppy/server-utils

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/server-utils"><img src="https://img.shields.io/npm/v/@uppy/server-utils.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

Client library for communication with Uppy Server. Intended for use in Uppy plugins.

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
const Uppy = require('@uppy/core')
const { Provider, RequestClient, Socket } = require('@uppy/server-utils')

const uppy = Uppy()

const client = new RequestClient(uppy, { serverUrl: 'https://uppy.mywebsite.com/' })
client.get('/drive/list').then(() => {})

const provider = new Provider(uppy, {
  serverUrl: 'https://uppy.mywebsite.com/',
  provider: providerPluginInstance
})
provider.checkAuth().then(() => {})

const socket = new Socket({ target: 'wss://uppy.mywebsite.com/' })
socket.on('progress', () => {})
```

## Installation

> Unless you are writing a custom provider plugin, you do not need to install this.

```bash
$ npm install @uppy/server-utils --save
```

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/DOC_PAGE_HERE).

## License

[The MIT License](./LICENSE).
