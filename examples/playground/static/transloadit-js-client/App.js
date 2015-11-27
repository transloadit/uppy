import Transloadit from './core/Transloadit';

const transloadit = new Transloadit({wait: false});
const files = transloadit
  .use(DragDrop, {modal: true})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();

console.log('--> Finished transloadit. Final result: ');
console.dir(files);
