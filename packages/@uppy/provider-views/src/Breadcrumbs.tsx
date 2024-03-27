import type { FileInPartialTree, UnknownProviderPluginState } from '@uppy/core/lib/Uppy'
import { h, Fragment } from 'preact'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type ProviderView from './ProviderView'

type BreadcrumbProps = {
  getFolder: () => void
  title: string
  isFirst?: boolean
}

const Breadcrumb = (props: BreadcrumbProps) => {
  const { getFolder, title, isFirst } = props

  return (
    <Fragment>
      {!isFirst ? ' / ' : ''}
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        onClick={getFolder}
      >
        {title}
      </button>
    </Fragment>
  )
}

type BreadcrumbsProps<M extends Meta, B extends Body> = {
  getFolder: ProviderView<M, B>['getFolder']
  title: string
  breadcrumbsIcon: JSX.Element
  breadcrumbs: FileInPartialTree[]
}

export default function Breadcrumbs<M extends Meta, B extends Body>(
  props: BreadcrumbsProps<M, B>,
): JSX.Element {
  const { getFolder, title, breadcrumbsIcon, breadcrumbs } = props

  return (
    <div className="uppy-Provider-breadcrumbs">
      <div className="uppy-Provider-breadcrumbsIcon">{breadcrumbsIcon}</div>
      <Breadcrumb
        key="root"
        getFolder={() => getFolder("root")}
        title={title}
        isFirst
      />
      {breadcrumbs.map((directory, i) => (
        <Breadcrumb
          key={directory.id}
          getFolder={() => getFolder(directory.data.requestPath)}
          title={directory.data.name}
        />
      ))}
    </div>
  )
}
