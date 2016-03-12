import Plugin from './Plugin'

export default class Formtag extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
  }

  run (results) {
    console.log({
      class: 'Formtag',
      method: 'run',
      results: results
    })

    // this.setProgress(0)

    // form FormData
    // const formData = new FormData(this.dropzone)
    //
    // Array.from(files).forEach((file, i) => {
    //   console.log(`file-${i}`)
    //   formData.append(`file-${i}`, file)
    // })

    const button = document.querySelector(this.opts.doneButtonSelector)
    var self = this

    return new Promise((resolve, reject) => {
      button.addEventListener('click', (e) => {
        var fields = document.querySelectorAll(self.opts.selector)
        var selected = [];

        [].forEach.call(fields, (field, i) => {
          selected.push({
            from: 'Formtag',
            files: field.files
          })
        })

        // console.log(fields.length);
        // for (var i in fields) {
        //   console.log('i');
        //   // console.log('i: ', i);
        //   for (var j in fields[i].files) {
        //     console.log('j');
        //     // console.log('i, j', i, j);
        //     console.log(fields[i].files);
        //     var file = fields[i].files.item(j);
        //     if (file) {
        //       selected.push({
        //         from: 'Formtag',
        //         file: fields[i].files.item(j)
        //       });
        //     }
        //   }
        // }
        // self.setProgress(100)
        console.log({
          selected: selected,
          fields: fields
        })
        resolve(selected)
      })
    })
  }
}
