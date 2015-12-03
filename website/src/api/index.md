---
type: api
order: 0
title: "Architecture"
---

# Uppy File Uploader Architecture

*Work in progress, API not stable. Last update: 2015-12-03*

## The Gist

``` javascript
import Uppy from './src/core';
import { DragDrop, Tus10 } from './src/plugins';

const uppy = new Uppy({wait: false});
const files = uppy
  .use(DragDrop, {selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();
```

## Core

1. Core class `Uppy` accepts global object `options`, and exposes methods like `.use` for adding plugins and `.set` for setting options.
2. We create a new instance of `Uppy` and call `.use` methods on that, passing the plugins and their options.
3. Plugins have types: `presetter`, `selecter` and `uploader` (more types could be added in the future). When `use` is called, each plugin’s `run` method is added to an array of corresponding types, `methods`.
4. Ok, here is the tricky part. Core’s method `run` iterates over plugin types in a waterfall manner — each `runTypes`  runs its `method`s in parallel and returns an array of results (files) to the next plugin type in the waterfall:

![waterfall of parallels](uppy-core-plugins-architecture.jpg)

## Plugins

1. Plugins are registered like this:
```javascript
uppy
  .use(DragDrop, {selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
```

Internally, plugins extend from a `UppyPlugin` class, see that for details.


2. Settings and handlers are chainable, set like this:
```javascript
uppy
  .set({ wait: true })
  .use(transloaditModal, {some: 'config'})
  .use(dragdrop, {target: transloaditModal})
  .use(instagram, {some: 'config'})
  .on('progress', handleProgress)
  .on('error', handleError);
```

3. In `Uppy` everything is a plugin: a `Modal` dialog, `Drag & Drop`, `Instagram`. We borrow general approach from the new Babel and PostCSS — each chunk of functionality exists as separate plugin — easier to pick and choose exactly what you need to get a lightweight solution for production, while also easier to develop and avoid merge conflicts.

4. There will be a simplified version that includes all the necessary plugins and sane defaults.
```javascript
uppyDist
  .set({ wait: true })
  .run();
```

5. Users should be able to set themes and style settings in config: `.use(myTheme)`.

6. Would be cool if you could use whatever drag & drop library you wanted (DropZone) with our wrapper.

## References & Inspiration

1. [PostCSS](https://github.com/postcss/postcss/blob/master/lib/postcss.es6#L19)
2. [Markdown-It](https://github.com/markdown-it/markdown-it/blob/master/lib/index.js#L459)
3. [Babel](babeljs.io)
4. [Lodash](https://lodash.com/)
5. [Vue.js](http://vuejs.org/guide/plugins.html#Using_a_Plugin)
6. [Tus.js](https://github.com/tus/tus-js-client)
