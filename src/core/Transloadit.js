import async from 'async';

export default class Transloadit {
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
    // if (!this.plugins[plugin.type]) {
    //   this.plugins[plugin.type] = [];
    // }
    this.plugins[plugin.type] = this.plugins[plugin.type] || [];
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
    // var files = []
    // for (var j in this.types) {
    //   var type = this.types[j];
    //   // Walk over all plugins of this type, passing & modifying the files array as we go
    //   for (var i in this.plugins[type]) {
    //     var plugin = this.plugins[type][i];
    //     console.log('--> Now running ' + plugin.type + ' plugin ' + plugin.name + ': ');
    //     files = plugin.run(files);
    //     console.dir(files);
    //     console.log('');
    //   }
    // }
    // console.log(this.plugins);
    // for (let plugin in this.plugins) {
    //   console.log(this.plugins[plugin]);
    //   this.plugins[plugin].run().then(function (text) {
    //     console.log(text);
    //   })
    // }

    // array of promises from all plugins
    // Promise.all(plugins).then(function(files) {
    //   console.log(files);
    // });
    // Walk over plugins in the order as defined by this.types.

    // plugins.push(plugin.run.bind(plugin));

    var pluginTypePacks = [];
    function dummy(cb) {
      cb(null, 'smth');
    }
    // pluginTypePacks.push(async.value([]));
    pluginTypePacks.push(dummy);

    for (let j in this.types) {
      const type = this.types[j];

      const pluginPack = [];
      for (let i in this.plugins[type]) {
        const plugin = this.plugins[type][i];
        pluginPack.push(plugin.run.bind(plugin));
      }
      // console.log(pluginPack);

      // async.parallel(pluginPack, function (err, files) {
      //   // console.log('parallel done');
      //   console.log(files);
      //   // done(files);
      // });
      const pluginTypePackExecuter = function (files, done) {
        async.parallel(pluginPack, function (err, files) {
          // console.log('parallel done');
          // console.log(files);
          done(files);
        });
      };

      pluginTypePacks.push(pluginTypePackExecuter);
    }

    async.waterfall(pluginTypePacks, function (result) {
      // console.log(result);
    });

    // console.log(plugins);


    // core.run is the final step and retuns the results (vs every other method, returning `this`)
    // for chainability
    // return files;
  }
}
