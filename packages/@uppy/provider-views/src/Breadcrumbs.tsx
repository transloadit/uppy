import type { UnknownProviderPluginState } from '@uppy/core/lib/Uppy'
import { h, Fragment } from 'preact'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type ProviderView from './ProviderView/index.js'

type BreadcrumbProps = {
  navigateToFolder: () => void
  title: string
  isLast: boolean
}

const Breadcrumb = (props: BreadcrumbProps) => {
  const { navigateToFolder, title, isLast } = props

  return (
    <Fragment>
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        onClick={navigateToFolder}
      >
        {title}
      </button>
      {!isLast ? ' / ' : ''}
    </Fragment>
  )
}

type BreadcrumbsProps<M extends Meta, B extends Body> = {
  navigateToFolder: ProviderView<M, B>['navigateToFolder']
  title: string
  breadcrumbsIcon: h.JSX.Element
  breadcrumbs: UnknownProviderPluginState['breadcrumbs']
}

export default function Breadcrumbs<M extends Meta, B extends Body>(
  props: BreadcrumbsProps<M, B>,
) {
  const { navigateToFolder, title, breadcrumbsIcon, breadcrumbs } = props

  return (
    <div className="uppy-Provider-breadcrumbs">
      <div className="uppy-Provider-breadcrumbsIcon">{breadcrumbsIcon}</div>
      {breadcrumbs.map((directory, i) => (
        <Breadcrumb
          key={directory.id}
          navigateToFolder={() =>
            navigateToFolder(directory.requestPath, directory.name)
          }
          title={i === 0 ? title : (directory.name as string)}
          isLast={i + 1 === breadcrumbs.length}
        />
      ))}
    </div>
  )
}
