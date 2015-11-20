
// Using classes internally
class Transloadit {
  constructor(options = {}) {
    this.options = options;
  }

  use(plugin, options) {
    const transloadit = this;
    plugin(transloadit, options);
    return this;
  }

  set(option) {
    // set some option here
    console.log(option);
    return this;
  }

  prepare(data) {
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
