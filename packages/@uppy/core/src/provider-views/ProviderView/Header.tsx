import classNames from 'classnames'
import type { h } from 'preact'
import type { Body, Meta, PartialTreeFolder } from '../../index.js'
import type { I18n } from '../../utils/index.js'
import Breadcrumbs from '../Breadcrumbs.js'
import type ProviderView from './ProviderView.js'
import type { ProviderToolbarAction } from './ProviderView.js'
import User from './User.js'

type HeaderProps<M extends Meta, B extends Body> = {
  showBreadcrumbs: boolean
  openFolder: ProviderView<M, B>['openFolder']
  breadcrumbs: PartialTreeFolder[]
  pluginIcon: () => h.JSX.Element
  title: string
  logout: () => void
  username: string | null
  i18n: I18n
  toolbarActions?: ProviderToolbarAction<M, B>[]
  runToolbarAction?: (action: ProviderToolbarAction<M, B>) => void
  /** The plugin is the whole page: no user/logout row (the app owns the session). */
  standalone?: boolean
  /**
   * A long operation runs (`ProviderView.runWithProgress`): anything that
   * would start another request, and so abort it, is disabled.
   */
  busy?: boolean
}

export default function Header<M extends Meta, B extends Body>(
  props: HeaderProps<M, B>,
) {
  const toolbarActions = props.toolbarActions ?? []
  const busy = props.busy ?? false
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
            breadcrumbsIcon={props.pluginIcon?.()}
            title={props.title}
            i18n={props.i18n}
            disabled={busy}
          />
        )}
        {toolbarActions.length > 0 && (
          <div className="uppy-ProviderBrowser-toolbar">
            {toolbarActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="uppy-u-reset uppy-c-btn uppy-ProviderBrowser-toolbarBtn"
                onClick={() => props.runToolbarAction?.(action)}
                disabled={busy}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        {!props.standalone && (
          <User
            logout={props.logout}
            username={props.username}
            i18n={props.i18n}
            disabled={busy}
          />
        )}
      </div>
    </div>
  )
}
