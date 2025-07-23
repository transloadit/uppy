import type { Body, Meta, PartialTreeFolder } from '@uppy/core'
import { Fragment, h } from 'preact'
import type ProviderView from './ProviderView/index.js'

type BreadcrumbsProps<M extends Meta, B extends Body> = {
  openFolder: ProviderView<M, B>['openFolder']
  title: string
  breadcrumbsIcon: h.JSX.Element
  breadcrumbs: PartialTreeFolder[]
  i18n: any
}

export default function Breadcrumbs<M extends Meta, B extends Body>(
  props: BreadcrumbsProps<M, B>,
): h.JSX.Element {
  const { openFolder, title, breadcrumbsIcon, breadcrumbs, i18n } = props

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
            {folder.type === 'root'
              ? title
              : (folder.data.name ?? i18n('unnamed'))}
          </button>
          {breadcrumbs.length === index + 1 ? '' : ' / '}
        </Fragment>
      ))}
    </div>
  )
}
