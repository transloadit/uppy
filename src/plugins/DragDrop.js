import Utils from '../core/Utils';
import TransloaditPlugin from './TransloaditPlugin';
// import Tus from 'tus-js-client';

export default class DragDrop extends TransloaditPlugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'selecter';

    // set default options
    const defaultOptions = {
      bla: 'blabla',
      autoSubmit: true,
      modal: true
    };

    // merge default options with the ones set by user
    this.opts = defaultOptions;
    Object.assign(this.opts, opts);

    console.log(this.opts);

    // get the element where Drag & Drop event will occur
    this.dropzone = document.querySelectorAll(this.opts.selector)[0];
    this.dropzoneInput = document.querySelectorAll('.UppyDragDrop-input')[0];

    this.status = document.querySelectorAll('.UppyDragDrop-status')[0];

    this.isDragDropSupported = this.checkDragDropSupport();

    // crazy stuff so that ‘this’ will behave in class
    this.listenForEvents = this.listenForEvents.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this);
    this.upload = this.upload.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  /**
   * Checks if the browser supports Drag & Drop
   */
  checkDragDropSupport() {
    const div = document.createElement('div');
    return (('draggable' in div) ||
           ('ondragstart' in div && 'ondrop' in div)) &&
           'FormData' in window && 'FileReader' in window;
  }

  listenForEvents() {
    if (this.isDragDropSupported) {
      Utils.addClass(this.dropzone, 'is-dragdrop-supported');
    }

    // prevent default actions for all drag & drop events
    Utils.addListenerMulti(this.dropzone, 'drag dragstart dragend dragover dragenter dragleave drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Toggle is-dragover state when files are dragged over or dropped
    Utils.addListenerMulti(this.dropzone, 'dragover dragenter', () => {
      Utils.addClass(this.dropzone, 'is-dragover');
    });

    Utils.addListenerMulti(this.dropzone, 'dragleave dragend drop', () => {
      Utils.removeClass(this.dropzone, 'is-dragover');
    });

    this.dropzone.addEventListener('drop', this.handleDrop);

    this.dropzoneInput.addEventListener('change', this.handleInputChange);

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
    const files = e.dataTransfer.files;
    const formData = new FormData(this.dropzone);
    // console.log('pizza', formData);

    for (var i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
      console.log('pizza', files[i]);
    }

    this.upload(formData);
  }

  handleInputChange() {
    // const fileInput = document.querySelectorAll('.UppyDragDrop-input')[0];
    const formData = new FormData(this.dropzone);
    console.log('pizza', formData);

    this.upload(formData);
  }

  upload(data) {
    this.displayStatus('Uploading...');

    const request = new XMLHttpRequest();
    request.open('POST', 'http://api2.transloadit.com', true);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    request.addEventListener('load', () => {
      console.log('fucking done!');
      this.displayStatus('Done.');
    });

    request.addEventListener('load', () => {
      this.displayStatus('Done.');
    });

    request.addEventListener('error', () => {
      console.log('fucking error!');
    });

    request.send(data);

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
