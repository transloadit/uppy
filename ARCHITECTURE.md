# Transloadit JavaScript SDK architecture

This file might be slightly outdate. Current proposal as of 2015-11-23 is reflected in  [classes.es6](https://github.com/transloadit/transloadit-js-client/blob/f1aa1072d5159c372624a57d5a8edaad2119efa9/classes.es6)


## Core

1. The core function `transloadit` accepts `options` and exposes methods like `.use` for adding plugins and `.set` for setting options.
2. Each plugin is then called by the `use` with given `options` as an argument.
3. The result is passed from the plugin to `prepareMedia` for some final processing
4. Then the processed files go into `upload` which uploads everything to Transloadit servers, using `tus`.

## Plugins

1. Plugins should be registered like this:
```javascript
  transloadit.use(dragndrop, {
    selector: '.drop'
  });
```

`dragndrop` here is function that we pass as an argument.
*For reference, see [Markdown-It](https://github.com/markdown-it/markdown-it/blob/master/lib/index.js#L459).*

2. Settings and handlers should be chainable and set like this:
```javascript
transloadit
  .set({ wait: true })
  .use(transloaditModal, {some: 'config'})
  .use(dragdrop, {target: transloaditModal})
  .use(instagram, {some: 'config'})
  .on('progress', handleProgress)
  .on('error', handleError);
```

3. In `transloadit-js` everything is a plugin: a `Modal` dialog, `Drag & Drop`, `Instagram`. We borrow general approach from the new Babel and PostCSS — almost barebones by default, each chunk of functionality exists as separate plugin — easier to pick and choose exactly what you need to get a lightweight solution for production, while also easier to develop and avoid merge conflicts.

4. Presets should exist with basic plugins like `Modal` & `Drag & Drop`. This should let people who just want to get it working as quickly as possible get started in seconds:
    ```javascript
    transloadit
      .set({ wait: true })
      .use(transloaditBasic, {some: 'config'})
    ```

    *See [`es2015-preset`](https://babeljs.io/docs/plugins/preset-es2015/) for Babel and [`PreCSS`](https://github.com/jonathantneal/precss#plugins) for PostCSS.*

    or just make it a code sample for easy copy/pasting and future customizations (no need to change the main function call, just add/remove lines to modify behaviour):
    ```javascript
    transloadit
      .set({ wait: true })
      .use(transloaditModal, {some: 'config'})
      .use(dragdrop, {target: transloaditModal})
    ```

5. Users should be able to set themes and style settings in config: `.use(myTheme)`.

6. Would be cool if you could use whatever drag & drop library you wanted (DropZone) with our wrapper.

## Usage

```javascript
import transloadit   from 'transloadit';
import dragndrop     from 'transloadit-dragndrop';
import instagram     from 'transloadit-instagram';
import modal         from 'transloadit-modal';

// import Transloadit from 'transloadit-client'
// import { dropbox, instagram, dragdrop, webcam } from 'transloadit-client/plugins'

// or to import all of them
// import { * as plugins } from 'transloadit/plugins'

transloadit
  .set({ wait: true })
  .use(modal, {some: 'config'})
  .use(dragdrop, {target: transloaditModal})
  .use(instagram, {some: 'config'})
  .on('progress', handleProgress)
  .on('error', handleError)
  .on('done', handleResult);
```

## References & Inspiration

1. PostCSS
2. Markdown-It
3. Babel
4. Lodash
