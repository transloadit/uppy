export default class DragDrop extends TransloaditPlugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'selecter';
  }

  run(files) {
    this.core.setProgress(this, 0);
    var selected = [ {name: 'lolcat.jpeg'} ]
    this.core.setProgress(this, 100);

    return selected;
  }
}
