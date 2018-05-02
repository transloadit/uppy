const classNames = require('classnames')
const Breadcrumbs = require('./Breadcrumbs')
const Filter = require('./Filter')
const Table = require('./ItemList')
const { h } = require('preact')

module.exports = (props) => {
  let filteredFolders = props.folders
  let filteredFiles = props.files

  if (props.filterInput !== '') {
    filteredFolders = props.filterItems(props.folders)
    filteredFiles = props.filterItems(props.files)
  }

  return (
    <div class={classNames('uppy-ProviderBrowser', `uppy-ProviderBrowser-viewType--${props.viewType}`)}>
      <div class="uppy-ProviderBrowser-header">
        <div class={classNames('uppy-ProviderBrowser-headerBar', !props.showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple')}>
          <div class="uppy-Provider-breadcrumbsIcon">{props.pluginIcon && props.pluginIcon()}</div>
          {props.showBreadcrumbs && Breadcrumbs({
            getFolder: props.getFolder,
            directories: props.directories,
            title: props.title
          })}
          <span class="uppy-ProviderBrowser-user">{props.username}</span>
          <button type="button" onclick={props.logout} class="uppy-ProviderBrowser-userLogout">Log out</button>
        </div>
      </div>
      { props.showFilter && <Filter {...props} /> }
      {Table({
        columns: [{
          name: 'Name',
          key: 'title'
        }],
        folders: filteredFolders,
        files: filteredFiles,
        activeRow: props.isActiveRow,
        sortByTitle: props.sortByTitle,
        sortByDate: props.sortByDate,
        isChecked: props.isChecked,
        handleFolderClick: props.getNextFolder,
        toggleCheckbox: props.toggleCheckbox,
        getItemName: props.getItemName,
        getItemIcon: props.getItemIcon,
        handleScroll: props.handleScroll,
        title: props.title,
        showTitles: props.showTitles,
        getItemId: props.getItemId,
        i18n: props.i18n
      })}
      <div class="uppy-ProviderBrowser-footer">
        <button class="uppy-u-reset uppy-c-btn uppy-c-btn-primary" onclick={props.done}>
          Select
        </button>
        <button class="uppy-u-reset uppy-c-btn uppy-c-btn-link" onclick={props.cancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
