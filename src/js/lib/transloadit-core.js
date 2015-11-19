
// Using classes internally
class Transloadit {
  constructor(opts = {}) {
    this.opts = opts;
  }

  use(plugin, opts) {
    plugin(opts);
    return this;
  }

  set(option) {
    // set some option here
    console.log(option);
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

export default function transloadit(options) {
  return new Transloadit(options);
}
