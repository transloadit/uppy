---
title: CDN
type: examples
order: 0
snippets: [ playground/src/html/app.html, playground/src/js/app.html ]
---

> CDN

<script src="/js/uppy.js"></script>

<script>
var uppy = new Uppy.Core();
uppy.use(Uppy.plugins.Tus10);

console.log(Uppy);
console.log('Uppy loaded from CDN with a tus 1.0 plugin');
</script>


This example showcases sourcing an UMD dist build straight from a CDN.
