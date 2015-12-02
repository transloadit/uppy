import { toggleClass, addClass, removeClass, addListenerMulti } from '../core/Utils';
import TransloaditPlugin from './TransloaditPlugin';
// import Tus from 'tus-js-client';

export default class DragDrop extends TransloaditPlugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'selecter';
    this.opts = opts;
    console.log(this.opts);

    // get the element where Drag & Drop event will occur
    this.dropzone = document.querySelectorAll(this.opts.selector)[0];
    this.status = document.querySelectorAll('.UppyDragDrop-status')[0];

    // crazy stuff so that ‘this’ will behave in class
    this.listenForEvents = this.listenForEvents.bind(this);
    // this.toggleDragoverState = this.toggleDragoverState.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.checkDragDropSupport = this.checkDragDropSupport(this);
  }

  checkDragDropSupport() {
    this.isDragDropSupported = function () {
      const div = document.createElement('div');
      return (('draggable' in div) ||
             ('ondragstart' in div && 'ondrop' in div))
             && 'FormData' in window && 'FileReader' in window;
    }();
  }

  listenForEvents() {
    if (this.isDragDropSupported) {
      addClass(this.dropzone, 'is-dragdrop-supported');
    }

    // prevent default actions for all drag & drop events
    addListenerMulti(this.dropzone, 'drag dragstart dragend dragover dragenter dragleave drop', (e) => {
      // console.log('yo!');
      e.preventDefault();
      e.stopPropagation();
    });

    // Toggle is-dragover state when files are dragged over or dropped
    addListenerMulti(this.dropzone, 'dragover dragenter', () => {
      addClass(this.dropzone, 'is-dragover');
    });

    addListenerMulti(this.dropzone, 'dragleave dragend drop', () => {
      removeClass(this.dropzone, 'is-dragover');
    });

    this.dropzone.addEventListener('drop', this.handleDrop);

    console.log(`waiting for some files to be dropped on ${this.opts.selector}`);
  }

  // Toggle is-dragover state when files are dragged over or dropped
  // in this case — add/remove 'is-dragover' class
  // toggleDragoverState(e) {
  //   toggleClass(this.dropzone, 'is-dragover');
  // }

  displayStatus(status) {
    this.status.innerHTML = status;
  }

  handleDrop(e) {
    console.log('all right, someone dropped something here...');
    this.displayStatus('Uploading...');
    const files = e.dataTransfer.files;
    console.log(files);
    // this.handleFiles(files);
  }

  handleFiles(files) {
    // Create a new tus upload
    // const upload = new Tus.Upload(files, {
    //   endpoint: 'http://master.tus.io:8080',
    //   onError: function(error) {
    //     console.log('Failed because: ' + error);
    //   },
    //   onProgress: function(bytesUploaded, bytesTotal) {
    //     var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
    //     console.log(bytesUploaded, bytesTotal, percentage + '%');
    //   },
    //   onSuccess: function() {
    //     console.log('Download %s from %s', upload.file.name, upload.url);
    //   }
    // });

    // Start the upload
    // upload.start();
  }

  run(files, done) {
    console.dir({
      method: 'DragDrop.run',
      files : files,
      done  : done
    });

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
