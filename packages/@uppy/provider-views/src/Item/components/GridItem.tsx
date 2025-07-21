import type { PartialTreeFile, PartialTreeFolderNode } from '@uppy/core'
import { h } from 'preact'
import ItemIcon from './ItemIcon.js'

type GridItemProps = {
  file: PartialTreeFile | PartialTreeFolderNode
  toggleCheckbox: (event: Event) => void
  className: string
  isDisabled: boolean
  restrictionError: string | null
  showTitles: boolean
  children?: h.JSX.Element | null
  i18n: any
}

function GridItem({
  file,
  toggleCheckbox,
  className,
  isDisabled,
  restrictionError,
  showTitles,
  children = null,
  i18n,
}: GridItemProps): h.JSX.Element {
  return (
    <li
      className={className}
      title={isDisabled && restrictionError ? restrictionError : undefined}
    >
      <input
        type="checkbox"
        className="uppy-u-reset uppy-ProviderBrowserItem-checkbox uppy-ProviderBrowserItem-checkbox--grid"
        onChange={toggleCheckbox}
        name="listitem"
        id={file.id}
        checked={file.status === 'checked'}
        disabled={isDisabled}
        data-uppy-super-focusable
      />
      <label
        htmlFor={file.id}
        aria-label={file.data.name ?? i18n('unnamed')}
        className="uppy-u-reset uppy-ProviderBrowserItem-inner"
      >
        <ItemIcon itemIconString={file.data.thumbnail || file.data.icon} />
        {showTitles && (file.data.name ?? i18n('unnamed'))}
        {children}
      </label>
    </li>
  )
}

export default GridItem
