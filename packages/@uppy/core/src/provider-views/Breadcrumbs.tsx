import { Fragment, type h } from 'preact'
import type { Body, Meta, PartialTreeFolder } from '../index.js'
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
      {breadcrumbs.map((folder, index) => {
        const label =
          folder.type === 'root' ? title : (folder.data.name ?? i18n('unnamed'))
        const isCurrent = breadcrumbs.length === index + 1

        return (
          <Fragment key={folder.id}>
            <button
              type="button"
              className="uppy-u-reset uppy-c-btn"
              onClick={isCurrent ? undefined : () => openFolder(folder.id)}
              aria-current={isCurrent ? 'page' : undefined}
              title={label}
            >
              {label}
            </button>
            {!isCurrent && (
              <span
                aria-hidden="true"
                className="uppy-Provider-breadcrumbsSeparator"
              >
                /
              </span>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
