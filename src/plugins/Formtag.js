import Plugin from './Plugin';

export default class Formtag extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'selecter';
  }

  run(results) {
    console.log(results);
    console.log(this.opts);

    this.core.setProgress(this, 0);

    var selected = [];
    // for (var i in files) {
    //   var file = files[i];
    //   this.upload(file);
    //   this.core.setProgress(this, (i * 1) + 1);
    //   selected[i]     = file;
    //   selected[i].url = this.opts.endpoint + '/selected/' + file.name;
    // }

    this.core.setProgress(this, 100);

    return Promise.resolve(selected);
  }
}
