---
type: api
order: 0
title: "Architecture"
permalink: api/
---

*Work in progress, API not stable. Last update: 2015-12-03*

### The Gist

``` javascript
import Uppy from './src/core';
import { DragDrop, Tus10 } from './src/plugins';

const uppy = new Uppy({wait: false});
const files = uppy
  .use(DragDrop, {selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();
```

### Core

1. Core class `Uppy` accepts object `options` (with general options), and exposes methods `.use` for adding plugins and `.set` for setting options.
2. We create a new instance of `Uppy` and call `.use` on it, passing the plugins and their options.
3. Then `run` is called to get things going.
4. Plugins have types: `presetter`, `view`, `progressindicator`, `acquirer`, `uploader`, and `presenter` (more could be added in the future). When `use` is called, each plugin’s `run` method is added to an array of corresponding types, `methods`.
5. Ok, now the tricky part. Core’s method `run` iterates over plugin types in a waterfall manner — each `runTypes`  runs its `method`s in parallel and returns an array of results (files) to the next plugin type in the waterfall. This way we first get all the of files from `DragDrop`, `Dropbox`, `Instagram` and other inputs — then parse them somehow — and then upload:

![waterfall of parallels](/images/uppy-core-plugins-architecture.jpg)

### Plugins

1. Plugins are registered like this:
```javascript
uppy
  .use(DragDrop, {selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
```

Internally, plugins extend from a [`Plugin`](https://github.com/transloadit/uppy/blob/master/src/plugins/Plugin.js) class, see that for details.


2. Settings and handlers are chainable, set like this:
```javascript
uppy
  .set({ wait: true })
  .use(Modal, {target: 'div#mycontainer', some: 'config'})
  .use(DragDrop, {target: Modal})
  .use(Instagram, {target: Modal, some: 'config'})
  .on('progress', handleProgress)
  .on('error', handleError);
```

3. In `Uppy` everything is a plugin: a `Modal` dialog, `Drag & Drop`, `Instagram`. We borrow general approach from the new Babel and PostCSS — each chunk of functionality exists as separate plugin — easier to pick and choose exactly what you need to get a lightweight solution for production, while also easier to develop and avoid merge conflicts.

4. There will be a simplified preset that strings together many Plugins using sane defaults.
```javascript
uppy
  .use(Basic, {target: 'div#mycontainer', endpoint: 'http://master.tus.io:8080'})
  .run();
```

5. Users will be able to rol out themes and style settings via plain CSS .

6. Would be cool if you could use whatever drag & drop library you wanted (DropZone) with our wrapper.

### References & Inspiration

1. [PostCSS](https://github.com/postcss/postcss/blob/master/lib/postcss.es6#L19)
2. [Markdown-It](https://github.com/markdown-it/markdown-it/blob/master/lib/index.js#L459)
3. [Babel](babeljs.io)
4. [Lodash](https://lodash.com/)
5. [Vue.js](http://vuejs.org/guide/plugins.html#Using_a_Plugin)
6. [The tus js client](https://github.com/tus/tus-js-client)
