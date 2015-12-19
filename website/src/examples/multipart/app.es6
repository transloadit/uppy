import Uppy from 'uppy/core';
import { Formtag, Multipart } from 'uppy/plugins';

const uppy = new Uppy({wait: false});
const files = uppy
  .use(Formtag, {selector: '#upload-form'})
  .use(Multipart, {endpoint: 'http://api2.transloadit.com'})
  .run();
