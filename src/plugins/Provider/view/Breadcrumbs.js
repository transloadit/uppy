const { h } = require('preact')
const Breadcrumb = require('./Breadcrumb')

module.exports = (props) => {
  return (
    <ul class="uppy-Provider-breadcrumbs">
      {
        props.directories.map((directory, i) => {
          return Breadcrumb({
            getFolder: () => props.getFolder(directory.id),
            title: i === 0 ? props.title : directory.title
          })
        })
      }
    </ul>
  )
}
