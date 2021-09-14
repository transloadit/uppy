const classNames = require('classnames')
const { h } = require('preact')
const Filter = require('./Filter')
const ItemList = require('./ItemList')
const FooterActions = require('./FooterActions')

const Browser = (props) => {
  const {
    currentSelection,
    folders,
    files,
    uppyFiles,
    viewType,
    headerComponent,
    showBreadcrumbs,
    isChecked,
    getNextFolder,
    toggleCheckbox,
    handleScroll,
    showTitles,
    title,
    i18n,
    validateRestrictions,
    showFilter,
  } = props

  const selected = currentSelection.length

  return (
    <div className={classNames('uppy-ProviderBrowser', `uppy-ProviderBrowser-viewType--${viewType}`)}>
      <div className="uppy-ProviderBrowser-header">
        <div className={classNames('uppy-ProviderBrowser-headerBar', !showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple')}>
          {headerComponent}
        </div>
      </div>
      {showFilter && <Filter {...props} />}
      <ItemList
        columns={[{
          name: 'Name',
          key: 'title',
        }]}
        folders={folders}
        files={files}
        isChecked={isChecked}
        handleFolderClick={getNextFolder}
        toggleCheckbox={toggleCheckbox}
        handleScroll={handleScroll}
        title={title}
        showTitles={showTitles}
        i18n={i18n}
        viewType={viewType}
        validateRestrictions={validateRestrictions}
        uppyFiles={uppyFiles}
        currentSelection={currentSelection}
      />
      {selected > 0 && <FooterActions selected={selected} {...props} />}
    </div>
  )
}

module.exports = Browser
