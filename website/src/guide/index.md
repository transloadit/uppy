---
title: Getting Started
type: guide
order: 0
---

> **Compatibility Note:** Uppy does not support IE8 and below.

## NPM

NPM is the recommended installation method when building large scale apps with Uppy. It pairs nicely with a CommonJS module bundler such as [Webpack](http://webpack.github.io/) or [Browserify](http://browserify.org/).

``` bash
# latest stable
$ npm install uppy
```

``` javascript
import Uppy from 'uppy/core';
import { DragDrop, Tus10 } from 'uppy/plugins';

const uppy = new Uppy({wait: false});
const files = uppy
  .use(DragDrop, {selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();
```

## Standalone & CDN

``` html
<div id="drag-drop"></div>

<script src="http://assets.transloadit.com/uppy.min.js" />
<script>
var uppy = new Uppy();
uppy
  .use(DragDrop, {selector: '#drag-drop'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();
</script>
```
