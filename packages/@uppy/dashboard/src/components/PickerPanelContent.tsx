import type {
  Body,
  Meta,
  State,
  UIPlugin,
  UIPluginOptions,
  Uppy,
} from '@uppy/core'
import type { I18n } from '@uppy/core/utils'
import { useRef } from '@uppy/core/utils/preact/hooks'
import classNames from 'classnames'
import type { ComponentChildren, MouseEventHandler } from 'preact'
import type { DashboardState } from '../Dashboard.js'
import ignoreEvent from '../utils/ignoreEvent.js'

type AnyUIPlugin<M extends Meta, B extends Body> = UIPlugin<
  UIPluginOptions,
  M,
  B
>

interface PickerPanelContentProps<M extends Meta, B extends Body> {
  activePickerPanel: NonNullable<DashboardState<M, B>['activePickerPanel']>
  className?: string | undefined
  hideAllPanels: MouseEventHandler<HTMLButtonElement>
  i18n: I18n
  state: State<M, B>
  uppy: Uppy<M, B>
}

function PickerPanelContent<M extends Meta, B extends Body>({
  activePickerPanel,
  className,
  hideAllPanels,
  i18n,
  state,
  uppy,
}: PickerPanelContentProps<M, B>): ComponentChildren {
  const ref = useRef<HTMLDivElement>(null)
  const activePlugin = uppy.getPlugin(activePickerPanel.id) as
    | AnyUIPlugin<M, B>
    | undefined
  // A plugin that is the whole page (a file library rather than a picker)
  // asks for no chrome: the page around it owns the heading, and there is
  // nothing to cancel.
  const standalone = Boolean(
    (activePlugin?.opts as { standalone?: boolean } | undefined)?.standalone,
  )

  return (
    <div
      className={classNames('uppy-DashboardContent-panel', className)}
      role="tabpanel"
      data-uppy-panelType="PickerPanel"
      id={`uppy-DashboardContent-panel--${activePickerPanel.id}`}
      onDragOver={ignoreEvent}
      onDragLeave={ignoreEvent}
      onDrop={ignoreEvent}
      onPaste={ignoreEvent}
    >
      {!standalone && (
        <div className="uppy-DashboardContent-bar">
          <div
            className="uppy-DashboardContent-title"
            role="heading"
            aria-level={1}
          >
            {i18n('importFrom', { name: activePickerPanel.name })}
          </div>
          <button
            className="uppy-DashboardContent-back"
            type="button"
            onClick={hideAllPanels}
          >
            {i18n('cancel')}
          </button>
        </div>
      )}

      <div ref={ref} className="uppy-DashboardContent-panelBody">
        {/* The panel can still be rendered once while its plugin is being
            removed (uppy.removePlugin / uppy.destroy), so tolerate a
            missing plugin instead of throwing during teardown. */}
        {activePlugin?.render(state, ref.current!)}
      </div>
    </div>
  )
}

export default PickerPanelContent
