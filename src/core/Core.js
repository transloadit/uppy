function promiseWaterfall([resolvedPromise, ...tasks]) {
    const finalTaskPromise = tasks.reduce(function (prevTaskPromise, task) {
        return prevTaskPromise.then(task);
    }, resolvedPromise(1));  // initial value

    return finalTaskPromise;
}

export default class {
  constructor(opts) {
    // Dictates in what order different plugin types are ran:
    this.types = [ 'presetter', 'selecter', 'uploader' ];

    this.type = 'core';

    // Container for different types of plugins
    this.plugins = {};
  }

  use(Plugin, opts) {
    // Instantiate
    var plugin = new Plugin(this, opts);
    this.plugins[plugin.type] = this.plugins[plugin.type] || [];
    this.plugins[plugin.type].push(plugin);

    return this;
  }

  setProgress(plugin, percentage) {
    // Any plugin can call this via `this.core.setProgress(this, precentage)`
    console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage);
    return this;
  }

  // Runs all plugins of the same type in parallel
  runType(type, files) {
    console.dir({
      method: 'Core.runType',
      type  : type,
      files : files
      // cb    : cb
    });

    // const methods = this.plugins[type].map(
    //   plugin => {
    //     return new Promise(function (resolve, reject) {
    //       plugin.run.call(plugin, files).then(files => resolve(files));
    //     });
    //   }
    // );

    const methods = this.plugins[type].map(
      plugin => plugin.run.call(plugin, files)
    );

    return Promise.all(methods);

    // async.parallel(methods, cb);
  }

  // Runs a waterfall of runType plugin packs, like so:
  // All preseters(data) --> All selecters(data) --> All uploaders(data) --> done
  run() {
    console.dir({
      method: 'Core.run'
    });

    // let typeMethods = [];
    // typeMethods.push(async.constant([]));

    // for (let t in this.types) {
    //   const type = this.types[t];
    //   typeMethods.push(this.runType.bind(this, type));
    // }

    // this.types.forEach(type => {
    //   if (this.plugins[type]) {
    //     typeMethods.push(this.runType.bind(this, type));
    //   }
    // });

    // First we select only plugins of current type,
    // then create an array of runType methods of this plugins
    let typeMethods = this.types.filter(type => {
      return this.plugins[type];
    }).map(type => this.runType.bind(this, type));

    promiseWaterfall(typeMethods)
      .then((result) => console.log(result))
      .catch((error) => console.error(error));

    // async.waterfall(typeMethods, function (err, finalFiles) {
    //   console.dir({
    //     err       : err ,
    //     finalFiles: finalFiles
    //   });
    // });
  }
}
