import Plugin from './Plugin';

export default class Multipart extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'uploader';
  }

  run(files) {
    // console.log(files);
    this.core.setProgress(this, 0);

    var uploaded = [];
    for (var i in files) {
      var file = files[i];
      this.upload(file);
      this.core.setProgress(this, (i * 1) + 1);
      uploaded[i]     = file;
      uploaded[i].url = this.opts.endpoint + '/uploaded/' + file.name;
    }
    this.core.setProgress(this, 100);

    return Promise.resolve(uploaded);
  }

  upload(data) {
    this.displayStatus('Uploading...');

    const request = new XMLHttpRequest();
    boundary = '---------------------------' + Date.now().toString(16);
    request.setRequestHeader('Content-Type', 'multipart\/form-data; boundary=' + boundary);
    request.sendAsBinary('--' + boundary + '\r\n' + oData.segments.join('--' + boundary + '\r\n') + '--' + boundary + '--\r\n');

    request.addEventListener('load', () => {
      console.log('fucking done!');
      this.displayStatus('Done.');
    });

    request.addEventListener('load', () => {
      this.displayStatus('Done.');
    });

    request.addEventListener('error', () => {
      console.log('fucking error!');
    });

    request.send(data);
  }
}
