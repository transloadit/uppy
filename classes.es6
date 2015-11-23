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
        var plugin = this.plugins[type][i];
        console.log('--> Now running ' + plugin.type + ' plugin ' + plugin.name + ': ');
        files = plugin.run(files);
        console.dir(files);
        console.log('');
      }
    }
    return files;
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
    this.core.setProgress(this, 0);
    this.core.setProgress(this, 100);
    var selected = [ 'lolcat.jpeg' ]
    return selected;
  }
}

class Tus10 extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'uploader';
  }

  run(files) {
    this.core.setProgress(this, 1);
    this.core.setProgress(this, 100);
    for (var i in files) {
      files[i] = this.opts.endpoint + '/uploaded/' + files[i];
    }
    return files;
  }
}

// Example use:

var transloadit = new Core({wait: false});
var files = transloadit
  .use(DragDrop, {modal: true})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080'})
  .run();

console.log('--> Finished transloadit. Final result: ');
console.dir(files);

// $ node classes.es6

// This outputs:

// --> Now running selecter plugin DragDrop:
// selecter plugin DragDrop set the progress to 0
// selecter plugin DragDrop set the progress to 100
// [ 'lolcat.jpeg' ]
//
// --> Now running uploader plugin Tus10:
// uploader plugin Tus10 set the progress to 1
// uploader plugin Tus10 set the progress to 100
// [ 'http://master.tus.io:8080/uploaded/lolcat.jpeg' ]
//
// --> Finished transloadit. Final result:
// [ 'http://master.tus.io:8080/uploaded/lolcat.jpeg' ]
