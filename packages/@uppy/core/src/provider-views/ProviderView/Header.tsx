import classNames from 'classnames'
import type { h } from 'preact'
import type { Body, Meta, PartialTreeFolder } from '../../index.js'
import type { I18n } from '../../utils/index.js'
import Breadcrumbs from '../Breadcrumbs.js'
import type ProviderView from './ProviderView.js'
import type {
  ProviderBulkAction,
  ProviderToolbarAction,
} from './ProviderView.js'
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
  /** Manager mode: the explicit multi-select switch. */
  selectionToggle?: { active: boolean; onToggle: () => void }
  /**
   * Picker mode: actions over the checked items, shown next to the folder
   * actions while something is selected. (Manager mode has them in its footer.)
   */
  bulkActions?: ProviderBulkAction<M, B>[]
  runBulkAction?: (action: ProviderBulkAction<M, B>) => void
  selectedCount?: number
}

export default function Header<M extends Meta, B extends Body>(
  props: HeaderProps<M, B>,
) {
  const toolbarActions = props.toolbarActions ?? []
  const bulkActions = (props.selectedCount && props.bulkActions) || []
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
          />
        )}
        {(toolbarActions.length > 0 ||
          bulkActions.length > 0 ||
          props.selectionToggle) && (
          <div className="uppy-ProviderBrowser-toolbar">
            {props.selectionToggle && (
              // The label says what a click does; no `aria-pressed`, which
              // would announce "Cancel, pressed".
              <button
                type="button"
                className="uppy-u-reset uppy-c-btn uppy-ProviderBrowser-toolbarBtn"
                onClick={props.selectionToggle.onToggle}
              >
                {props.selectionToggle.active
                  ? props.i18n('cancel')
                  : props.i18n('selectMultiple')}
              </button>
            )}
            {toolbarActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="uppy-u-reset uppy-c-btn uppy-ProviderBrowser-toolbarBtn"
                onClick={() => props.runToolbarAction?.(action)}
              >
                {action.label}
              </button>
            ))}
            {bulkActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={classNames(
                  'uppy-u-reset uppy-c-btn uppy-ProviderBrowser-toolbarBtn',
                  action.danger && 'uppy-ProviderBrowser-toolbarBtn--danger',
                )}
                onClick={() => props.runBulkAction?.(action)}
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
          />
        )}
      </div>
    </div>
  )
}
