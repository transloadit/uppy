Influenced by:
  - <https://github.com/leonadler/drag-and-drop-across-browsers>
  - <https://github.com/silverwind/uppie/blob/master/uppie.js>
  - <https://stackoverflow.com/a/50030399/3192470>

### Why do we not use `getFilesAndDirectories()` api?

It's a proposed spec that seems to be barely implemented anywhere.
Supposed to work in Firefox and Edge, but it doesn't work in Firefox, and both Firefox and Edge support `.webkitGetAsEntry()` api anyway.
This page e.g. shows how this spec is supposed to function: <https://wicg.github.io/directory-upload/>, but it only works because of the polyfill.js that uses `.webkitGetAsEntry()` internally.
