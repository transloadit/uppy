import Plugin from './Plugin'
import DragDrop from './DragDrop'
import Tus10 from './Tus10'

class TransloaditBasic extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'presetter'
    this.core
      .use(DragDrop, {modal: true, wait: true})
      .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  }
}
