# Draft Transloadit JavaScript SDK architecture

### The main Processor
1. Processor (Transloadit?) accepts ```options``` and an array of ```plugins``` (each plugin also has own ```options```)
2. Processor iterates on plugins, calles each of them and returns the result.
3. The result is passed from the plugin to ```prepareMedia``` for some final processign
4. Then the processed stuff goes into ```upload``` which uploads everything to Transloadit

### Plugins
1. Plugins should be registered like this:
```javascript
  transloadit.use(dragndrop, {
    selector: '.drop'
  });
```
```dragndrop``` here is function that we pass as an argument.
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

3. In ```transloadit-js``` everything is a plugin: a modal dialog, drag & drop, Instagram . We take the general approach from the new Babel and PostCSS — almost barebones by default, each chunk of functionality exists in as separate plugin — easier to pick and choose exactly what you need to get a lightweight solution for production, but also easier to work on and avoid merge conflicts.

4. Presets with basic plugins like modal & dragndrop. This should let people who just want to get it working as quickly as possible get started in seconds:
    ```javascript
    transloadit
      .set({ wait: true })
      .use(transloaditBasic, {some: 'config'})
    ```

    *See [```es2015-preset```](https://babeljs.io/docs/plugins/preset-es2015/) for Babel and [```PreCSS```](https://github.com/jonathantneal/precss#plugins) for PostCSS.*

5. Users should be able to set themes and style settings in config: ```.use(myTheme)```.

6. Would be cool if you could use whatever drag & drop library you wanted (DropZone) with our wrapper.

### Usage
```javascript
import transloadit   from 'transloadit';
import dragndrop     from 'transloadit-dragndrop';
import dropbox       from 'transloadit-dropbox';
import instagram     from 'transloadit-instagram';
import modal         from 'transloadit-modal';

transloadit
  .set({ wait: true })
  .use(modal, {some: 'config'})
  .use(dragdrop, {target: transloaditModal})
  .use(instagram, {some: 'config'})
  .on('progress', handleProgress)
  .on('error', handleError)
  .on('done', handleResult);
```
