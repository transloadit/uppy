import Plugin from './Plugin';
import tus from 'tus-js-client';

export default class Tus10 extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'uploader';
  }

  run(results) {
    console.log({
      class  : 'Tus10',
      method : 'run',
      results: results
    });

    const files = this.extractFiles(results);

    this.setProgress(0);
    var uploaded  = [];
    var uploaders = [];
    for (var i in files) {
      var file = files[i];
      uploaders.push(this.upload(file, i, files.length));
    }

    return Promise.all(uploaders);
  }

  upload(file, current, total) {
    // Create a new tus upload
    var upload = new tus.Upload(file, {
      endpoint: this.opts.endpoint,
      onError: function (error) {
        return Promise.reject('Failed because: ' + error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        this.setProgress(percentage, current, total);
      },
      onSuccess: function () {
        console.log('Download %s from %s', upload.file.name, upload.url);
        return Promise.resolve(upload);
      }
    });
    // Start the upload
    upload.start();
  }
}
