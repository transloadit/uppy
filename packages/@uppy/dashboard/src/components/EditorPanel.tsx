import type Uppy from '@uppy/core'
import type { Body, State, UIPlugin } from '@uppy/core'
import type {
  I18n,
  Meta,
  Translator,
  UppyFile,
  UppyFileId,
} from '@uppy/core/utils'
import classNames from 'classnames'
import type { ComponentChildren, MouseEventHandler } from 'preact'
import type { TargetWithRender } from '../Dashboard.js'

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'file-editor:cancel': (file: UppyFile<M, B>) => void
  }
}

type EditorPanelProps<M extends Meta, B extends Body> = {
  className?: string | undefined
  closeFileEditor: () => void
  editors: TargetWithRender[]
  fileCardFor: UppyFileId | null
  files: State<M, B>['files']
  i18n: I18n
  i18nArray: Translator['translateArray']
  saveFileEditor: MouseEventHandler<HTMLButtonElement>
  state: State<M, B>
  uppy: Uppy<M, B>
}

function EditorPanel<M extends Meta, B extends Body>(
  props: EditorPanelProps<M, B>,
): ComponentChildren {
  const file = props.files[props.fileCardFor!]

  const handleCancel = () => {
    props.uppy.emit('file-editor:cancel', file)
    props.closeFileEditor()
  }

  return (
    <div
      className={classNames('uppy-DashboardContent-panel', props.className)}
      role="tabpanel"
      data-uppy-panelType="FileEditor"
      id="uppy-DashboardContent-panel--editor"
    >
      <div className="uppy-DashboardContent-bar">
        <div
          className="uppy-DashboardContent-title"
          role="heading"
          aria-level={1}
        >
          {props.i18nArray('editing', {
            file: (
              <span className="uppy-DashboardContent-titleFile">
                {file.meta ? file.meta.name : file.name}
              </span>
            ),
          })}
        </div>
        <button
          className="uppy-DashboardContent-back"
          type="button"
          onClick={handleCancel}
        >
          {props.i18n('cancel')}
        </button>
        <button
          className="uppy-DashboardContent-save"
          type="button"
          onClick={props.saveFileEditor}
        >
          {props.i18n('save')}
        </button>
      </div>
      <div className="uppy-DashboardContent-panelBody">
        {props.editors.map((target) => {
          return (
            props.uppy.getPlugin(target.id) as UIPlugin<
              // biome-ignore lint/complexity/noBannedTypes: {} means anything except null or undefined.
              {},
              M,
              B
            >
          ).render(props.state)
        })}
      </div>
    </div>
  )
}

export default EditorPanel
