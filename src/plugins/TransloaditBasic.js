import TransloaditPlugin from './TransloaditPlugin';
console.log(TransloaditPlugin)
class TransloaditBasic extends TransloaditPlugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'presetter';
    this.core
      .use(DragDrop, {modal: true, wait: true})
      .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  }
}
