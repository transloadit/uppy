const { h } = require('preact')
const classNames = require('classnames')

const remoteFileObjToLocal = require('@uppy/utils/lib/remoteFileObjToLocal')

const Filter = require('./Filter')
const FooterActions = require('./FooterActions')
const Item = require('./Item/index')

const VIRTUAL_SHARED_DIR = 'shared-with-me'

function Browser (props) {
  const {
    currentSelection,
    folders,
    files,
    uppyFiles,
    viewType,
    headerComponent,
    showBreadcrumbs,
    isChecked,
    toggleCheckbox,
    handleScroll,
    showTitles,
    i18n,
    validateRestrictions,
    showFilter,
    filterQuery,
    filterInput,
    getNextFolder,
    cancel,
    done,
    columns,
  } = props

  const selected = currentSelection.length

  return (
    <div
      className={classNames(
        'uppy-ProviderBrowser',
        `uppy-ProviderBrowser-viewType--${viewType}`,
      )}
    >
      <div className="uppy-ProviderBrowser-header">
        <div
          className={classNames(
            'uppy-ProviderBrowser-headerBar',
            !showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple',
          )}
        >
          {headerComponent}
        </div>
      </div>

      {showFilter && (
        <Filter
          i18n={i18n}
          filterQuery={filterQuery}
          filterInput={filterInput}
        />
      )}

      {(() => {
        if (!folders.length && !files.length) {
          return (
            <div className="uppy-Provider-empty">
              {props.i18n('noFilesFound')}
            </div>
          )
        }

        return (
          <div className="uppy-ProviderBrowser-body">
            <ul
              className="uppy-ProviderBrowser-list"
              onScroll={handleScroll}
              role="listbox"
              // making <ul> not focusable for firefox
              tabIndex="-1"
            >
              {folders.map((folder) => {
                return Item({
                  columns,
                  showTitles,
                  viewType,
                  i18n,
                  id: folder.id,
                  title: folder.name,
                  getItemIcon: () => folder.icon,
                  isChecked: isChecked(folder),
                  toggleCheckbox: (event) => toggleCheckbox(event, folder),
                  type: 'folder',
                  isDisabled: isChecked(folder)?.loading,
                  isCheckboxDisabled: folder.id === VIRTUAL_SHARED_DIR,
                  handleFolderClick: () => getNextFolder(folder),
                })
              })}

              {files.map((file) => {
                const validated = validateRestrictions(
                  remoteFileObjToLocal(file),
                  [...uppyFiles, ...currentSelection],
                )

                return Item({
                  id: file.id,
                  title: file.name,
                  author: file.author,
                  getItemIcon: () => file.icon,
                  isChecked: isChecked(file),
                  toggleCheckbox: (event) => toggleCheckbox(event, file),
                  columns,
                  showTitles,
                  viewType,
                  i18n,
                  type: 'file',
                  isDisabled: !validated.result && !isChecked(file),
                  restrictionReason: validated.reason,
                })
              })}
            </ul>
          </div>
        )
      })()}

      {selected > 0 && (
        <FooterActions
          selected={selected}
          done={done}
          cancel={cancel}
          i18n={i18n}
        />
      )}
    </div>
  )
}

module.exports = Browser
