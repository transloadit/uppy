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
    <div class={`uppy-ProviderBrowser uppy-ProviderBrowser-viewType--${props.viewType}`}>
      <div class="uppy-ProviderBrowser-header">
        <div class={`uppy-ProviderBrowser-headerBar ${!props.showBreadcrumbs ? 'uppy-ProviderBrowser-headerBar--simple' : ''}`}>
          <div class="uppy-Provider-breadcrumbsIcon">{props.pluginIcon && props.pluginIcon()}</div>
          {props.showBreadcrumbs && Breadcrumbs({
            getFolder: props.getFolder,
            directories: props.directories,
            title: props.title
          })}
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
        handleFileClick: props.addFile,
        handleFolderClick: props.getNextFolder,
        isChecked: props.isChecked,
        toggleCheckbox: props.toggleCheckbox,
        getItemName: props.getItemName,
        getItemIcon: props.getItemIcon,
        handleScroll: props.handleScroll,
        title: props.title,
        showTitles: props.showTitles,
        getItemId: props.getItemId
      })}
      <button class="UppyButton--circular UppyButton--blue uppy-ProviderBrowser-doneBtn"
        type="button"
        aria-label="Done picking files"
        title="Done picking files"
        onclick={props.done}>
        <svg aria-hidden="true" class="UppyIcon" width="13px" height="9px" viewBox="0 0 13 9">
          <polygon points="5 7.293 1.354 3.647 0.646 4.354 5 8.707 12.354 1.354 11.646 0.647" />
        </svg>
      </button>
    </div>
  )
}

// <div class="uppy-Dashboard-actions">
//  <button class="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-actionsBtn" type="button">Select</button>
// </div>
