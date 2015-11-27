class DropboxPlugin {
  constructor() {
    this.connect = this.connect.bind(this);
    this.render = this.render.bind(this);
    this.files = [];
    this.currentDir = '/';
  }

  connect(target) {
    this._target = document.getElementById(target);

    this.client = new Dropbox.Client({ key: 'b7dzc9ei5dv5hcv', token: '' });
    this.client.authDriver(new Dropbox.AuthDriver.Redirect());
    this.client.authenticate();

    if (this.client.credentials().token) {
      this.getDirectory();
    }
  }

  authenticate() {

  }

  addFile() {

  }

  getDirectory() {
    return this.client.readdir(this.currentDir, (error, entries, stat, statFiles) => {
      if (error) {
        return showError(error);  // Something went wrong.
      }
      return this.render(statFiles);
    });
  }

  run() {

  }

  render(files) {
    // for each file in the directory, create a list item element
    const elems = files.map((file, i) => {
      const icon = (file.isFolder) ? 'Folder' : 'File'
      return `<li data-type="${icon}" data-name="${file.name}"><span>${icon} : </span><span> ${file.name}</span></li>`
    })

    // appends the list items to the target
    this._target.innerHTML = elems.sort().join('');

    if (this.currentDir.length > 1) {
      const back = document.createElement('LI');
      back.setAttribute('data-type', 'back');
      back.innerHTML = '<span>...</span>';
      this._target.appendChild(back);
    }

    // add an onClick to each list item
    const fileElems = this._target.querySelectorAll('li');
    Array.prototype.forEach.call(fileElems, element => {
      var type = element.getAttribute('data-type');
      if (type === 'File') {
        element.addEventListener('click', e => {
          this.files.push(element.getAttribute('data-name'));
        });
      } else {
        element.addEventListener('dblclick', e => {
          console.log(type);
          console.log(this.currentDir.split('/').slice(0, length - 2))
          console.log(this.currentDir.split('/').slice(0, length - 2).join('/'));
          const length = this.currentDir.split('/').length;
          this.currentDir = (type === 'Folder') ?
            `${this.currentDir}${element.getAttribute('data-name')}/` :
              this.currentDir.split('/').slice(0, length - 2).join('/')
          console.log(this.currentDir);
          this.getDirectory();
        })
      }
    })
  }
}

export default new DropboxPlugin()
