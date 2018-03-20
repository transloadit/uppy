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
    <div class={`uppy uppy-ProviderBrowser uppy-ProviderBrowser-viewType--${props.viewType}`}>
      <header class="uppy-ProviderBrowser-header">
        <div class="uppy-ProviderBrowser-search" aria-hidden={!props.isSearchVisible}>
          { props.isSearchVisible && <Filter {...props} /> }
        </div>
        <div class="uppy-ProviderBrowser-headerBar">
          <button type="button" class="uppy-ProviderBrowser-searchToggle"
            onclick={props.toggleSearch}>
            <svg class="UppyIcon" viewBox="0 0 100 100">
              <path d="M87.533 80.03L62.942 55.439c3.324-4.587 5.312-10.207 5.312-16.295 0-.312-.043-.611-.092-.908.05-.301.093-.605.093-.922 0-15.36-12.497-27.857-27.857-27.857-.273 0-.536.043-.799.08-.265-.037-.526-.08-.799-.08-15.361 0-27.858 12.497-27.858 27.857 0 .312.042.611.092.909a5.466 5.466 0 0 0-.093.921c0 15.36 12.496 27.858 27.857 27.858.273 0 .535-.043.8-.081.263.038.524.081.798.081 5.208 0 10.071-1.464 14.245-3.963L79.582 87.98a5.603 5.603 0 0 0 3.976 1.647 5.621 5.621 0 0 0 3.975-9.597zM39.598 55.838c-.265-.038-.526-.081-.8-.081-9.16 0-16.612-7.452-16.612-16.612 0-.312-.042-.611-.092-.908.051-.301.093-.605.093-.922 0-9.16 7.453-16.612 16.613-16.612.272 0 .534-.042.799-.079.263.037.525.079.799.079 9.16 0 16.612 7.452 16.612 16.612 0 .312.043.611.092.909-.05.301-.094.604-.094.921 0 9.16-7.452 16.612-16.612 16.612-.274 0-.536.043-.798.081z" />
            </svg>
          </button>
          {Breadcrumbs({
            getFolder: props.getFolder,
            directories: props.directories,
            title: props.title
          })}
          <button type="button" onclick={props.logout} class="uppy-ProviderBrowser-userLogout">Log out</button>
        </div>
      </header>
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
