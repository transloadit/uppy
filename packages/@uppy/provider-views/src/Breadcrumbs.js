const { h, Fragment } = require('preact')

const Breadcrumb = (props) => {
  return (
    <Fragment>
      <button
        type="button"
        className="uppy-u-reset"
        onClick={props.getFolder}
      >
        {props.title}
      </button>
      {!props.isLast ? ' / ' : ''}
    </Fragment>
  )
}

module.exports = (props) => {
  return (
    <div className="uppy-Provider-breadcrumbs">
      <div className="uppy-Provider-breadcrumbsIcon">{props.breadcrumbsIcon}</div>
      {
        props.directories.map((directory, i) => (
          <Breadcrumb
            key={directory.id}
            getFolder={() => props.getFolder(directory.id)}
            title={i === 0 ? props.title : directory.title}
            isLast={i + 1 === props.directories.length}
          />
        ))
      }
    </div>
  )
}
