'use strict';

class Core {
  constructor(opts) {
    this.plugins = {
      selecter: [],
      uploader: [],
    };
  }

  use(Plugin, opts) {
    var plugin = new Plugin(this, opts);
    this.plugins[plugin.type].push(plugin);
    return this;
  }

  setProgress(plugin, percentage) {
    console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage);
    return this;
  }

  run() {
    // Dictates in what order different plugin types are ran:
    var types = ['selecter', 'uploader'];
    var files = []
    for (var j in types) {
      var type = types[j];
      for (var i in this.plugins[type]) {
        files = this.plugins[type][i].run(files);
      }
    }
  }
}

class Plugin {
  constructor(core, opts) {
    this.core = core
    this.opts = opts
    this.name = this.constructor.name;
  }
  run(files) {
    return files;
  }
}

class DragDrop extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'selecter';
  }

  run(files) {
    var selected = [ 'lolcat.jpeg' ]
    console.log('');
    console.log('Selected files: ');
    console.dir(selected);
    console.log('With options: ');
    console.dir(this.opts);
    this.core.setProgress(this, 80);

    return selected;
  }
}

class Tus10 extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'uploader';
  }

  run(files) {
    console.log('');
    console.log('Uploading files: ');
    console.dir(files);
    console.log('With options: ');
    console.dir(this.opts);
    this.core.setProgress(this, 80);
    return [ this.opts.endpoint + '/uploaded/lolcat.jpeg' ];
  }
}

// Example use:

var transloadit = new Core({wait: false});
transloadit
  .use(DragDrop, {modal: true})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();

// $ node classes.es6

// This outputs:

// Selected files:
// [ 'lolcat.jpeg' ]
// With options:
// { modal: true }
// selecter plugin DragDrop set the progress to 80
//
// Uploading files:
// [ 'lolcat.jpeg' ]
// With options:
// { endpoint: 'http://master.tus.io:8080' }
// uploader plugin Tus10 set the progress to 80
