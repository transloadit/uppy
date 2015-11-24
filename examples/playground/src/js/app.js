import Transloadit from '../../../../src/core/Transloadit';
import DragDrop from '../../../../src/plugins/DragDrop';
import Tus10 from '../../../../src/plugins/Tus10';

const transloadit = new Transloadit({wait: false});
const files = transloadit
  .use(DragDrop, {modal: true, selector: '#upload-target'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();

console.log('--> Finished transloadit. Final result: ');
console.dir(files);

// var Transloadit = require('./src/core/Transloadit.js');
// var DragDrop = require('./src/plugins/DragDrop.js');
// var Tus10 = require('./src/plugins/Tus10.js');
//
// var transloadit = new Transloadit({wait: false});
// var files = transloadit
//   .use(DragDrop, {modal: true})
//   .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
//   .run();
//
// console.log('--> Finished transloadit. Final result: ');
// console.dir(files);
