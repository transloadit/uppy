const html = require('yo-yo')
const Breadcrumb = require('./Breadcrumb')

module.exports = (props) => {
  return html`
    <ul class="UppyProvider-breadcrumbs">
      ${
        props.directories.map((directory) => {
          return Breadcrumb({
            getFolder: () => props.getFolder(directory.id),
            title: directory.title
          })
        })
      }
    </ul>
  `
}
