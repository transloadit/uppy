import Plugin from './Plugin';

export default class Formtag extends Plugin {
  constructor(core, opts) {
    super(core, opts);
    this.type = 'selecter';
  }

  run(results) {
    console.log({
      class  : 'Formtag',
      method : 'run',
      results: results
    });

    this.setProgress(0);

    var button = document.querySelector(this.opts.doneButtonSelector);
    var self   = this;
    button.addEventListener('click', (e) => {
      alert('hey');
      var fields   = document.querySelectorAll(self.opts.selector);
      var files    = [];
      var selected = [];
      for (let i in fields) {
        for (let j in fields[i].files) {
          selected.push(fields[i].files[j]);
        }
      }
      this.setProgress(100);
      return Promise.resolve(selected);
    });
  }
}
