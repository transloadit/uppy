export default class Plugin {
  // This contains boilerplate that all Plugins share - and should not be used
  // directly. It also shows which methods final plugins should implement/override,
  // this deciding on structure.
  constructor(core, opts) {
    this.core = core;
    this.opts = opts;
    this.type = 'none';
    this.name = this.constructor.name;
  }

  run(files) {
    return files;
  }
}
