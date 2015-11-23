'use strict';

// file: core/Core.js
class Core {
  constructor(opts) {
    // Dictates in what order different plugin types are ran:
    this.types = ['selecter', 'uploader'];

    // Container for different types of plugins
    this.plugins = {
      selecter: [],
      uploader: [],
    };
  }

  use(Plugin, opts) {
    // Instantiate
    var plugin = new Plugin(this, opts);

    // Save in container
    this.plugins[plugin.type].push(plugin);

    return this;
  }

  setProgress(plugin, percentage) {
    // Any plugin can call this via `this.core.setProgress(this, precentage)`
    console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage);
    return this;
  }

  run() {
    // Walk over plugins in the order as defined by this.types.
    var files = []
    for (var j in this.types) {
      var type = this.types[j];
      // Walk over all plugins of this type, passing & modifying the files array as we go
      for (var i in this.plugins[type]) {
        var plugin = this.plugins[type][i];
        console.log('--> Now running ' + plugin.type + ' plugin ' + plugin.name + ': ');
        files = plugin.run(files);
        console.dir(files);
        console.log('');
      }
    }

    // core.run is the final step and retuns the results (vs every other method, returning `this`)
    // for chainability
    return files;
  }
}

// file: plugins/Plugin.js
class Plugin {
  // This contains boilerplate that all Plugins share - and should not be used
  // directly. It also shows which methods final plugins should implement/override,
  // this deciding on structure.
  constructor(core, opts) {
    this.core = core
    this.opts = opts
    this.name = this.constructor.name;
  }
  run(files) {
    return files;
  }
}

// file: plugins/DragDrop.js
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

// file: plugins/Tus10.js
class Tus10 extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'uploader';
  }

  run(files) {

    this.core.setProgress(this, 1);
    var uploaded = []
    for (var i in files) {
      uploaded[i] = this.opts.endpoint + '/uploaded/' + files[i];
    }
    this.core.setProgress(this, 100);

    return uploaded;
  }
}

// file: ./examples/playground.js
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
