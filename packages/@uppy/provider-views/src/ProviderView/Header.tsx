/* eslint-disable react/destructuring-assignment */
import { h, Fragment } from 'preact'
import type { I18n } from '@uppy/utils/lib/Translator'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { UnknownProviderPluginState } from '@uppy/core/lib/Uppy'
import User from './User.tsx'
import Breadcrumbs from '../Breadcrumbs.tsx'
import type ProviderView from './ProviderView.js'

type HeaderProps<M extends Meta, B extends Body> = {
  showBreadcrumbs: boolean
  navigateToFolder: ProviderView<M, B>['navigateToFolder']
  breadcrumbs: UnknownProviderPluginState['breadcrumbs']
  pluginIcon: () => h.JSX.Element
  title: string
  logout: () => void
  username: string | undefined
  i18n: I18n
}

export default function Header<M extends Meta, B extends Body>(
  props: HeaderProps<M, B>,
) {
  return (
    <Fragment>
      {props.showBreadcrumbs && (
        <Breadcrumbs
          navigateToFolder={props.navigateToFolder}
          breadcrumbs={props.breadcrumbs}
          breadcrumbsIcon={props.pluginIcon && props.pluginIcon()}
          title={props.title}
        />
      )}
      <User logout={props.logout} username={props.username} i18n={props.i18n} />
    </Fragment>
  )
}
