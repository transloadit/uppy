import Transloadit from './core/Transloadit';
import DragDrop from './plugins/DragDrop';
import Tus10 from './plugins/Tus10';

const transloadit = new Transloadit({wait: false});
const files = transloadit
  .use(DragDrop, {modal: true})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();

console.log('--> Finished transloadit. Final result: ');
console.dir(files);
