import Uppy from 'uppy/core';
import { DragDrop, Multipart } from 'uppy/plugins';

const uppy = new Uppy({wait: false});
const files = uppy
  .use(DragDrop, {selector: '#upload-target'})
  .use(Multipart, {endpoint: '//api2.transloadit.com', fieldName: 'files[]'})
  .run();

console.log('Uppy ' + uppy.type + ' loaded');
