import { h, Fragment } from 'preact'

const Breadcrumb = (props) => {
  const { getFolder, title, isLast } = props

  return (
    <Fragment>
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        onClick={getFolder}
      >
        {title}
      </button>
      {!isLast ? ' / ' : ''}
    </Fragment>
  )
}

export default (props) => {
  const { getFolder, title, breadcrumbsIcon, directories } = props

  return (
    <div className="uppy-Provider-breadcrumbs">
      <div className="uppy-Provider-breadcrumbsIcon">{breadcrumbsIcon}</div>
      {
        directories.map((directory, i) => (
          <Breadcrumb
            key={directory.id}
            getFolder={() => getFolder(directory.id)}
            title={i === 0 ? title : directory.title}
            isLast={i + 1 === directories.length}
          />
        ))
      }
    </div>
  )
}
