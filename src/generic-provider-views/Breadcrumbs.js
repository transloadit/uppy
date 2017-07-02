const html = require('yo-yo')
const Breadcrumb = require('./Breadcrumb')

module.exports = (props) => {
  return html`
    <ul class="UppyProvider-breadcrumbs">
      ${
        props.directories.map((directory, i) => {
          return Breadcrumb({
            getFolder: () => props.getFolder(directory.id),
            title: i === 0 ? props.title : directory.title
          })
        })
      }
    </ul>
  `
}
