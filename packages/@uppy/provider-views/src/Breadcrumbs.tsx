import type { PartialTreeFolder } from '@uppy/core/lib/Uppy'
import { h, Fragment } from 'preact'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type ProviderView from './ProviderView'

type BreadcrumbsProps<M extends Meta, B extends Body> = {
  openFolder: ProviderView<M, B>['openFolder']
  title: string
  breadcrumbsIcon: JSX.Element
  breadcrumbs: PartialTreeFolder[]
}

export default function Breadcrumbs<M extends Meta, B extends Body>(
  props: BreadcrumbsProps<M, B>,
): JSX.Element {
  const { openFolder, title, breadcrumbsIcon, breadcrumbs } = props

  return (
    <div className="uppy-Provider-breadcrumbs">
      <div className="uppy-Provider-breadcrumbsIcon">{breadcrumbsIcon}</div>
      {breadcrumbs.map((folder, index) => (
        <Fragment>
          <button
            key={folder.id}
            type="button"
            className="uppy-u-reset uppy-c-btn"
            onClick={() => openFolder(folder.id)}
            >
            {folder.type === 'root' ? title : folder.data.name}
          </button>
          {breadcrumbs.length === index + 1 ? '' : ' / '}
        </Fragment>
      ))}
    </div>
  )
}
