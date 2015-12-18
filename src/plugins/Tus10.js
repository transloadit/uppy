import Plugin from './Plugin';
import Tus from 'tus-js-client';

export default class Tus10 extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'uploader';
  }

  run(files) {
    // console.log(files);
    this.core.setProgress(this, 0);
    var uploaded = [];
    // for (var i in files) {
    //   var file = files[i];
    //   this.core.setProgress(this, (i * 1) + 1);
    //   uploaded[i]     = file;
    //   uploaded[i].url = this.opts.endpoint + '/uploaded/' + file.name;
    // }
    this.core.setProgress(this, 100);

    // done(null, 'done with Tus');
    return Promise.resolve(files);

    // return uploaded;
  }
}
