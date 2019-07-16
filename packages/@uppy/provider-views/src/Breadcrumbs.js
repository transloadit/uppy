const { h } = require('preact')

const Breadcrumb = (props) => [
  <button
    type="button"
    class="uppy-u-reset"
    onclick={props.getFolder}>{props.title}
  </button>,
  !props.isLast ? ' / ' : ''
]

module.exports = (props) => {
  return (
    <div class="uppy-Provider-breadcrumbs">
      <div class="uppy-Provider-breadcrumbsIcon">{props.breadcrumbsIcon}</div>
      {
        props.directories.map((directory, i) => {
          return Breadcrumb({
            getFolder: () => props.getFolder(directory.id),
            title: i === 0 ? props.title : directory.title,
            isLast: i + 1 === props.directories.length
          })
        })
      }
    </div>
  )
}
