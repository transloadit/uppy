var client = new Dropbox.Client({ key: 'b7dzc9ei5dv5hcv', token: '' });

client.authDriver(new Dropbox.AuthDriver.Redirect());
client.authenticate();

console.log(client.credentials())

if (client.credentials().token) {
  client.readdir("/", function(error, entries, stat, statFiles) {
    if (error) {
      return showError(error);  // Something went wrong.
    }
    render(statFiles);

  });
}

function render(files) {
  var elems = files.map(function(file, i) {
    var icon = (file.isFolder) ? 'Folder' : 'File'
    return '<li><span>' + icon + '</span><span>' + file.name + '</span></li>'
  })

  elems.sort();

  // var target = document.getElementById('target');
  // target.innerHTML = elems.join('');
}

export default class DropboxPlugin {
  constructor() {

  }

  connect() {

  }

  authenticate() {

  }

  addFile() {

  }

  getDirectory() {

  }

  upload() {

  }
}
