import type { UnknownProviderPluginState } from '@uppy/core/lib/Uppy'
import { h, Fragment } from 'preact'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type ProviderView from './ProviderView'

type BreadcrumbProps = {
  getFolder: () => void
  title: string
  isLast: boolean
}

const Breadcrumb = (props: BreadcrumbProps) => {
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

type BreadcrumbsProps<M extends Meta, B extends Body> = {
  getFolder: ProviderView<M, B>['getFolder']
  title: string
  breadcrumbsIcon: JSX.Element
  breadcrumbs: UnknownProviderPluginState['breadcrumbs']
}

export default function Breadcrumbs<M extends Meta, B extends Body>(
  props: BreadcrumbsProps<M, B>,
): JSX.Element {
  const { getFolder, title, breadcrumbsIcon, breadcrumbs } = props

  return (
    <div className="uppy-Provider-breadcrumbs">
      <div className="uppy-Provider-breadcrumbsIcon">{breadcrumbsIcon}</div>
      {breadcrumbs.map((directory, i) => (
        <Breadcrumb
          key={directory.id}
          getFolder={() => getFolder(directory.requestPath, directory.name)}
          title={i === 0 ? title : (directory.name as string)}
          isLast={i + 1 === breadcrumbs.length}
        />
      ))}
    </div>
  )
}
