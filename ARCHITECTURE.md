# Draft Transloadit JavaScript SDK architecture

### The main Processor
1. Processor (Transloadit?) accepts ```options``` and an array of ```plugins``` (each plugin also has own ```options```)
2. Processor iterates on plugins, calles each of them and returns the result.
3. The result is passed from the plugin to ```prepareMedia``` for some final processign
4. Then the processed stuff goes into ```upload``` which uploads everything to Transloadit

### Plugins
1. We should be able to register a plugin with something like:
```
  transloadit.plugin('dragndrop', function(options) {
    console.log('dragging and dropping here');
  });
```
or:
```
  transloadit.use(dragndrop, {
    selector: '.drop'
  });
```
2. ?

### Usage
```
import transloadit   from 'transloadit';
import dragndrop     from 'transloadit-dragndrop';
import dropbox'      from 'transloadit-dropbox';

transloadit([
  dragndrop(),
  dropbox({
    folder: '/media',
    allowSmth: true
  })
])
.then(function (result) {
  console.log(`Done processing: ${result}`);
});
```
