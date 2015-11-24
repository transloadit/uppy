export default class TransloaditPlugin {
  // This contains boilerplate that all TransloaditPlugins share - and should not be used
  // directly. It also shows which methods final plugins should implement/override,
  // this deciding on structure.
  constructor(core, opts) {
    this.core = core;
    this.opts = opts;
    this.name = this.constructor.name;
  }

  run(files) {
    return files;
  }
}
