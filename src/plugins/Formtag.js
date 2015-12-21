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

    const button = document.querySelector(this.opts.doneButtonSelector);
    var self     = this;

    return new Promise((resolve, reject) => {
      button.addEventListener('click', (e) => {
        var fields   = document.querySelectorAll(self.opts.selector);
        var files    = [];
        var selected = [];
        for (var i in fields) {
          for (var j in fields[i].files) {
            var file = fields[i].files.item(j);
            if (file) {
              selected.push({
                from: 'Formtag',
                file: fields[i].files.item(j)
              });
            }
          }
        }
        self.setProgress(100);
        console.log({
          selected:selected,
          fields  :fields
        })
        resolve(selected);
      });
    });
  }
}
