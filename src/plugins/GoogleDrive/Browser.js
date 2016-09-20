import html from '../../core/html'
import Sidebar from './Sidebar'
import Table from './Table'

export default (props, bus) => {
  let filteredFolders = props.folders
  let filteredFiles = props.files

  if (props.filterInput !== '') {
    filteredFolders = props.filterItems(props.folders)
    filteredFiles = props.filterItems(props.files)
  }

  return html`
    <div>
      <div class="container-fluid">
        <div class="row">
          <div class="hidden-md-down col-lg-12 col-xl-12">
            ${Sidebar({
              getRootDirectory: () => props.getNextFolder('root', 'Google Drive'),
              logout: props.logout,
              filterQuery: props.filterQuery,
              filterInput: props.filterInput
            })}
          </div>
          <div class="col-md-12 col-lg-12 col-xl-12">
            <div class="UppyGoogleDrive-browserContainer">
              ${Table({
                folders: filteredFolders,
                files: filteredFiles,
                activeRow: props.activeRow,
                sortByTitle: props.sortByTitle,
                sortByDate: props.sortByDate,
                handleRowClick: props.handleRowClick,
                handleFileDoubleClick: props.addFile,
                handleFolderDoubleClick: props.getNextFolder
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
