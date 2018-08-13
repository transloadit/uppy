const { h } = require('preact')

const Breadcrumb = (props) => {
  return (
    <button type="button" onclick={props.getFolder}>{props.title}</button>
  )
}

module.exports = (props) => {
  return (
    <div class="uppy-Provider-breadcrumbs">
      {
        props.directories.map((directory, i) => {
          return Breadcrumb({
            getFolder: () => props.getFolder(directory.id),
            title: i === 0 ? props.title : directory.title
          })
        })
      }
    </div>
  )
}
