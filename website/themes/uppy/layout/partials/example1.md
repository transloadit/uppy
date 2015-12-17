```html
<div id="upload-target"></div>

<script src="http://assets.transloadit.com/uppy.min.js">
<script>
  var uppy = new Uppy.Core();
  uppy
    .use(Uppy.plugins.DragDrop, {selector: '#upload-target'})
    .use(Uppy.plugins.Tus10, {endpoint: 'http://master.tus.io:8080'})
    .run();
</script>
```
