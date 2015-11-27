import TransloaditPlugin from './TransloaditPlugin';
import { toggleClass } from '../core/Utils';

export default class DragDrop extends TransloaditPlugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'selecter';
    this.opts = opts;
    console.log(this.opts);

    // get the element where Drag & Drop event will occur
    this.dropzone = document.querySelectorAll(this.opts.selector)[0];

    // crazy stuff so that ‘this’ will behave in class
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  listenForEvents() {
    this.dropzone.addEventListener('dragenter', this.handleDragEnter);
    this.dropzone.addEventListener('dragover', this.handleDragOver);
    this.dropzone.addEventListener('drop', this.handleDrop);
    console.log(`waiting for some files to be dropped on ${this.opts.selector}`);
  }

  handleDragEnter(e) {
    event.stopPropagation();
    event.preventDefault();
    toggleClass(this.dropzone, 'is-dragover');
  }

  handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  handleDrop(e) {
    console.log('all right, someone dropped something here...');
    e.preventDefault();
    toggleClass(this.dropzone, 'is-dragover');
    const files = e.dataTransfer.files;
    console.log(files);
    this.handleFiles(files);
  }

  handleFiles(files) {
    return files;
  }

  run(files, done) {
    console.log('DragDrop running!');
    // console.log(files);
    this.listenForEvents();
    this.core.setProgress(this, 0);
    var selected = [ {name: 'lolcat.jpeg'} ];
    this.core.setProgress(this, 100);
    // return selected;
    done(null, 'done with DragDrop');
    // return Promise.resolve('done with DragDrop');
  }
}
