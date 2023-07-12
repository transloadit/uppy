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
  const { getFolder, title, breadcrumbsIcon, breadcrumbs } = props

  return (
    <div className="uppy-Provider-breadcrumbs">
      <div className="uppy-Provider-breadcrumbsIcon">{breadcrumbsIcon}</div>
      {
        breadcrumbs.map((directory, i) => (
          <Breadcrumb
            key={directory.id}
            getFolder={() => getFolder(directory.requestPath)}
            title={i === 0 ? title : directory.name}
            isLast={i + 1 === breadcrumbs.length}
          />
        ))
      }
    </div>
  )
}
