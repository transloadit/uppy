import Uppy from 'uppy/core';
import { Dropbox, Tus10 } from 'uppy/plugins';

const uppy = new Uppy({wait: false});
const files = uppy
  .use(Dropbox, {selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();

console.log(uppy.type);
