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

    // console.log(files);

    this.setProgress(0);
    // var uploaded  = [];
    var uploaders = [];
    for (var i in files) {
      var file = files[i];
      uploaders.push(this.upload(file, i, files.length));
    }

    return Promise.all(uploaders);
  }

  /**
 * Create a new Tus upload
 *
 * @param {object} file for use with upload
 * @param {integer} current file in a queue
 * @param {integer} total number of files in a queue
 * @returns {Promise}
 */
  upload(file, current, total) {
    // Create a new tus upload
    const self = this;
    const upload = new tus.Upload(file, {
      endpoint: this.opts.endpoint,
      onError: function (error) {
        return Promise.reject('Failed because: ' + error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        percentage = Math.round(percentage);
        self.setProgress(percentage, current, total);
      },
      onSuccess: function () {
        console.log(`Download ${upload.file.name} from ${upload.url}`);
        return Promise.resolve(upload);
      }
    });
    // Start the upload
    upload.start();
  }
}
