import Plugin from './Plugin';

export default class Multipart extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'uploader';
  }

  run(results) {
    console.log({
      class  : 'Multipart',
      method : 'run',
      results: results
    });

    const files = this.extractFiles(results);

    this.core.setProgress(this, 0);
    var uploaded  = [];
    var uploaders = [];
    for (var i in files) {
      var file = files[i];
      uploaders.push(this.upload(file, i, files.length));
    }

    return Promise.all(uploaders);
  }

  upload(file, current, total) {
    var formPost = new FormData();
    formPost.append('file', file);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', this.opts.endpoint, true);

    xhr.addEventListener('progress', (e) => {
      var percentage = (e.loaded / e.total * 100).toFixed(2);
      this.setProgress(percentage, current, total);
    });

    xhr.addEventListener('load', () => {
      return Promise.resolve(upload);
    });

    xhr.addEventListener('error', () => {
      return Promise.reject('fucking error!');
    });

    xhr.send(formPost);
  }
}
