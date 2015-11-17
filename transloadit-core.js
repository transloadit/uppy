// The plugin
let dragndrop = function(options) {
  console.log(options.selector);
  console.log('dragging and dropping here');
//   return function (options) {
//     console.log('dragging and dropping here');
//   };
};

// Using classes internally
class Transloadit {
  constructor(opts = {}, plugins = []) {
    this.opts = opts;
    this.plugins = plugins;
  }

  plugin(name, initializer) {
    return initializer();
  }

  use (iterator, opts) {
    iterator(opts);
    return this;
  }

  prepare() {
    // ...
  }

  upload(files) {
    return new Promise(function (resolve, reject) {
      // ...
      resolve('upload successful');
    });
  }
}

let transloadit = new Transloadit();
transloadit.use(dragndrop, {
  selector: '.drop'
});


// Then the function is exposed to the user
// it accepts an array of plugins and their options
// transloadit(['dragndrop', 'dropbox', 'instagram']);
// let transloadit = function (plugins) {
// //   if ( plugins.length === 1 && Array.isArray(plugins[0]) ) {
// //     plugins = plugins[0];
// //   }
//   return new Transloadit(plugins);
// };

// Then we invoke it
// transloadit([
//   dragndrop(),
//   dropbox({
//     folder: '/media',
//     allowSmth: true
//   })
// ]);

// transloadit([
//   {dragndrop, {selector: '.dragndrop-zone'}},
//   {dropbox, {
//     folder: '/media',
//     allowSmth: true
//   }})
// ]);

// transloadit('dragndrop', 'dropbox', 'instagram')
//   .then(function (result) {
//     console.log(`Done processing: ${result}`)
//   });
