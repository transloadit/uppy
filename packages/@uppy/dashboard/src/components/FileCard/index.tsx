import type { Body, Meta, State } from '@uppy/core'
import type { I18n, Translator, UppyFile } from '@uppy/core/utils'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from '@uppy/core/utils/preact/hooks'
import classNames from 'classnames'
import { nanoid } from 'nanoid/non-secure'
import type { ComponentChildren, TargetedMouseEvent } from 'preact'
import type { DashboardState } from '../../Dashboard.js'
import getFileTypeIcon from '../../utils/getFileTypeIcon.js'
import ignoreEvent from '../../utils/ignoreEvent.js'
import FilePreview from '../FilePreview.js'
import RenderMetaFields from './RenderMetaFields.js'

interface FileCardProps<M extends Meta, B extends Body> {
  canEditFile: (file: UppyFile<M, B>) => boolean
  className?: string | undefined
  fileCardFor: string
  files: State<M, B>['files']
  i18n: I18n
  i18nArray: Translator['translateArray']
  metaFields: DashboardState<M, B>['metaFields']
  openFileEditor: (file: UppyFile<M, B>) => void
  requiredMetaFields: string[]
  saveFileCard: (meta: M, fileID: string) => void
  toggleFileCard: (show: boolean, fileID: string) => void
}

export default function FileCard<M extends Meta, B extends Body>(
  props: FileCardProps<M, B>,
): ComponentChildren {
  const {
    files,
    fileCardFor,
    toggleFileCard,
    saveFileCard,
    metaFields,
    requiredMetaFields,
    openFileEditor,
    i18n,
    i18nArray,
    className,
    canEditFile,
  } = props

  const getMetaFields = () => {
    return typeof metaFields === 'function'
      ? metaFields(files[fileCardFor!])
      : metaFields
  }

  const file = files[fileCardFor!]
  const computedMetaFields = getMetaFields() ?? []
  const showEditButton = canEditFile(file)

  const storedMetaData = {} as M
  computedMetaFields.forEach((field) => {
    // @ts-expect-error TODO fix me
    storedMetaData[field.id] = file.meta[field.id] ?? ''
  })

  const [formState, setFormState] = useState(storedMetaData)

  const handleSave = useCallback(
    (ev: SubmitEvent | TargetedMouseEvent<HTMLElement>) => {
      ev.preventDefault()
      saveFileCard(formState, fileCardFor)
    },
    [saveFileCard, formState, fileCardFor],
  )

  const updateMeta = (newVal: string, name: string) => {
    setFormState({
      ...formState,
      [name]: newVal,
    })
  }

  const handleCancel = () => {
    // @ts-expect-error TODO fix me
    toggleFileCard(false)
  }

  const [form] = useState(() => {
    const formEl = document.createElement('form')
    formEl.setAttribute('tabindex', '-1')
    formEl.id = nanoid()
    return formEl
  })

  // We need to know where Uppy is being rendered
  const domRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /**
     * Use the "rootNode" of whereever Uppy is rendered, falling back
     * to `window.document` if domRef isn't initialized for some reason
     */
    const rootNode = domRef.current?.getRootNode() ?? (document as Node)
    /**
     * This is the case for the Light DOM and <iframes>.
     * In these scenarios, we don't want to append a child to an
     * <html> element, but to the <body>
     */
    if (rootNode instanceof Document) {
      rootNode.body.appendChild(form)
    }
    // This is the case for the Shadow DOM
    else if (rootNode instanceof ShadowRoot) {
      rootNode.appendChild(form)
    }
    // Everything else (realistically there isn't)
    else {
      rootNode.appendChild(form)
    }
    form.addEventListener('submit', handleSave)
    return () => {
      form.removeEventListener('submit', handleSave)
      // check if form is still in the DOM before removing
      if (form.parentNode) {
        form.parentNode.removeChild(form)
      }
    }
  }, [form, handleSave])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ...
    <div
      className={classNames('uppy-Dashboard-FileCard', className)}
      data-uppy-panelType="FileCard"
      onDragOver={ignoreEvent}
      onDragLeave={ignoreEvent}
      onDrop={ignoreEvent}
      onPaste={ignoreEvent}
      ref={domRef}
    >
      <div className="uppy-DashboardContent-bar">
        <div
          className="uppy-DashboardContent-title"
          role="heading"
          aria-level={1}
        >
          {i18nArray('editing', {
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
          form={form.id}
          title={i18n('finishEditingFile')}
          onClick={handleCancel}
        >
          {i18n('cancel')}
        </button>
      </div>

      <div className="uppy-Dashboard-FileCard-inner">
        <div
          className="uppy-Dashboard-FileCard-preview"
          style={{ backgroundColor: getFileTypeIcon(file.type).color }}
        >
          <FilePreview file={file} />
          {showEditButton && (
            <button
              type="button"
              className="uppy-u-reset uppy-c-btn uppy-Dashboard-FileCard-edit"
              onClick={(event) => {
                // When opening the image editor we want to save any meta fields changes.
                // Otherwise it's confusing for the user to click save in the editor,
                // but the changes here are discarded. This bypasses validation,
                // but we are okay with that.
                handleSave(event)
                openFileEditor(file)
              }}
            >
              {/* At the moment we only have one file editor - image editor.
              If we get editors for other file formats (e.g. pdfs),
              we can conditionally display i18n('editFile')/i18n('editImage'). */}
              {i18n('editImage')}
            </button>
          )}
        </div>

        <div className="uppy-Dashboard-FileCard-info">
          <RenderMetaFields
            computedMetaFields={computedMetaFields}
            requiredMetaFields={requiredMetaFields}
            updateMeta={updateMeta}
            form={form}
            // @ts-expect-error TODO fix me
            formState={formState}
          />
        </div>

        <div className="uppy-Dashboard-FileCard-actions">
          <button
            className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-FileCard-actionsBtn"
            // If `form` attribute is supported, we want a submit button to trigger the form validation.
            // Otherwise, fallback to a classic button with a onClick event handler.
            type="submit"
            form={form.id}
          >
            {i18n('saveChanges')}
          </button>
          <button
            className="uppy-u-reset uppy-c-btn uppy-c-btn-link uppy-Dashboard-FileCard-actionsBtn"
            type="button"
            onClick={handleCancel}
            form={form.id}
          >
            {i18n('cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
