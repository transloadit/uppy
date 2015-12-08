import Uppy from '../../../../../../src/core';
import { DragDrop, Tus10 } from '../../../../../../src/plugins';

const uppy = new Uppy({wait: false});
const files = uppy
  .use(DragDrop, {selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();
