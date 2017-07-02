const html = require('yo-yo')
const Breadcrumbs = require('./Breadcrumbs')
const Table = require('./Table')

module.exports = (props) => {
  let filteredFolders = props.folders
  let filteredFiles = props.files

  if (props.filterInput !== '') {
    filteredFolders = props.filterItems(props.folders)
    filteredFiles = props.filterItems(props.files)
  }

  return html`
    <div class="Browser Browser-viewType--${props.viewType}">
      <header class="Browser-header">
        <div class="Browser-search" aria-hidden="${!props.isSearchVisible}">
          <input type="text" class="Browser-searchInput" placeholder="Search"
                 onkeyup=${props.filterQuery} value="${props.filterInput}"/>
          <button type="button" class="Browser-searchClose" 
                  onclick=${props.toggleSearch}>
            <svg class="UppyIcon" viewBox="0 0 19 19">
              <path d="M17.318 17.232L9.94 9.854 9.586 9.5l-.354.354-7.378 7.378h.707l-.62-.62v.706L9.318 9.94l.354-.354-.354-.354L1.94 1.854v.707l.62-.62h-.706l7.378 7.378.354.354.354-.354 7.378-7.378h-.707l.622.62v-.706L9.854 9.232l-.354.354.354.354 7.378 7.378.708-.707-7.38-7.378v.708l7.38-7.38.353-.353-.353-.353-.622-.622-.353-.353-.354.352-7.378 7.38h.708L2.56 1.23 2.208.88l-.353.353-.622.62-.353.355.352.353 7.38 7.38v-.708l-7.38 7.38-.353.353.352.353.622.622.353.353.354-.353 7.38-7.38h-.708l7.38 7.38z"/>
            </svg>
          </button>
        </div>
        <div class="Browser-headerBar">
          <button type="button" class="Browser-searchToggle"
                  onclick=${props.toggleSearch}>
            <svg class="UppyIcon" viewBox="0 0 100 100">
              <path d="M87.533 80.03L62.942 55.439c3.324-4.587 5.312-10.207 5.312-16.295 0-.312-.043-.611-.092-.908.05-.301.093-.605.093-.922 0-15.36-12.497-27.857-27.857-27.857-.273 0-.536.043-.799.08-.265-.037-.526-.08-.799-.08-15.361 0-27.858 12.497-27.858 27.857 0 .312.042.611.092.909a5.466 5.466 0 0 0-.093.921c0 15.36 12.496 27.858 27.857 27.858.273 0 .535-.043.8-.081.263.038.524.081.798.081 5.208 0 10.071-1.464 14.245-3.963L79.582 87.98a5.603 5.603 0 0 0 3.976 1.647 5.621 5.621 0 0 0 3.975-9.597zM39.598 55.838c-.265-.038-.526-.081-.8-.081-9.16 0-16.612-7.452-16.612-16.612 0-.312-.042-.611-.092-.908.051-.301.093-.605.093-.922 0-9.16 7.453-16.612 16.613-16.612.272 0 .534-.042.799-.079.263.037.525.079.799.079 9.16 0 16.612 7.452 16.612 16.612 0 .312.043.611.092.909-.05.301-.094.604-.094.921 0 9.16-7.452 16.612-16.612 16.612-.274 0-.536.043-.798.081z"/>
            </svg>
          </button>
          ${Breadcrumbs({
            getFolder: props.getFolder,
            directories: props.directories,
            title: props.title
          })}
          <button type="button" onclick=${props.logout} class="Browser-userLogout">Log out</button>
        </div>
      </header>
      <div class="Browser-body">
        ${Table({
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
          getItemName: props.getItemName,
          getItemIcon: props.getItemIcon,
          handleScroll: props.handleScroll
        })}
      </div>
    </div>
  `
}
