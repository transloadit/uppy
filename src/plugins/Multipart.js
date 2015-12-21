import Plugin from './Plugin';

export default class Multipart extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'uploader';

    try {
        if (XMLHttpRequest.prototype.sendAsBinary) return;
        XMLHttpRequest.prototype.sendAsBinary = function (datastr) {
            function byteValue(x) {
                return x.charCodeAt(0) & 0xff;
            }
            var ords = Array.prototype.map.call(datastr, byteValue);
            var ui8a = new Uint8Array(ords);
            this.send(ui8a.buffer);
        }
    } catch (e) {}
  }

  run(results) {
    // console.log(results);
    this.core.setProgress(this, 0);

    var uploaded = [];
    for (var i in results) {
      var file = results[i];
      this.upload(file);
      this.core.setProgress(this, (i * 1) + 1);
      uploaded[i]     = file;
      uploaded[i].url = this.opts.endpoint + '/uploaded/' + file.name;
    }
    this.core.setProgress(this, 100);

    return Promise.resolve(uploaded);
  }

  upload(file) {
    const boundary = '---------------------------' + Date.now().toString(16);
    const request  = new XMLHttpRequest();

    const data = { segments: []};
    data.segments.push(file);

    request.open('POST', 'http://api2.transloadit.com', true);
    request.setRequestHeader('Content-Type', 'multipart\/form-data; boundary=' + boundary);
    request.sendAsBinary('--' + boundary + '\r\n' + data.segments.join('--' + boundary + '\r\n') + '--' + boundary + '--\r\n');

    // var request=new XMLHttpRequest();
    // request.open("POST", domain, true);
    // request.setRequestHeader("Content-type","multipart/form-data");
    // var formData = new FormData();
    // formData.append("data", data_json_string);
    // request.send(formData);


    request.addEventListener('load', () => {
      console.log('fucking done!');
    });

    request.addEventListener('error', () => {
      console.log('fucking error!');
    });

    request.send();
  }
}
