/* eslint-disable react/destructuring-assignment */
import { h } from 'preact'
import type { I18n } from '@uppy/utils/lib/Translator'
import type { Body, Meta, PartialTreeFolder } from '@uppy/core'
import classNames from 'classnames'
import User from './User.jsx'
import Breadcrumbs from '../Breadcrumbs.jsx'
import type ProviderView from './ProviderView.js'

type HeaderProps<M extends Meta, B extends Body> = {
  showBreadcrumbs: boolean
  openFolder: ProviderView<M, B>['openFolder']
  breadcrumbs: PartialTreeFolder[]
  pluginIcon: () => h.JSX.Element
  title: string
  logout: () => void
  username: string | null
  i18n: I18n
}

export default function Header<M extends Meta, B extends Body>(
  props: HeaderProps<M, B>,
) {
  return (
    <div className="uppy-ProviderBrowser-header">
      <div
        className={classNames(
          'uppy-ProviderBrowser-headerBar',
          !props.showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple',
        )}
      >
        {props.showBreadcrumbs && (
          <Breadcrumbs
            openFolder={props.openFolder}
            breadcrumbs={props.breadcrumbs}
            breadcrumbsIcon={props.pluginIcon && props.pluginIcon()}
            title={props.title}
            i18n={props.i18n}
          />
        )}
        <User
          logout={props.logout}
          username={props.username}
          i18n={props.i18n}
        />
      </div>
    </div>
  )
}
