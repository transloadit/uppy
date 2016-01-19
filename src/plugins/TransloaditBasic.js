import Plugin from './Plugin'

class TransloaditBasic extends Plugin {
  constructor(core, opts) {
    super(core, opts)
    this.type = 'presetter'
    this.core
      .use(DragDrop, {modal: true, wait: true})
      .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  }
}
