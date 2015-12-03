```html
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
