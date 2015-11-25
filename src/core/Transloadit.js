export default class {
  constructor(opts) {
    // Dictates in what order different plugin types are ran:
    this.types = [ 'presetter', 'selecter', 'uploader' ];

    // Container for different types of plugins
    this.plugins = {};
  }

  use(Plugin, opts) {
    // Instantiate
    var plugin = new Plugin(this, opts);

    // Save in plugin container
    if (!this.plugins[plugin.type]) {
      this.plugins[plugin.type] = [];
    }
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
