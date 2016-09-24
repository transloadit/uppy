import html from '../../../core/html'
import Table from './Table'

export default (props) => {
  let filteredFolders = props.folders
  let filteredFiles = props.files

  if (props.filterInput !== '') {
    filteredFolders = props.filterItems(props.folders)
    filteredFiles = props.filterItems(props.files)
  }

  return html`
    <div class="Browser">
      <header>
        <input type="text" class="Browser-search" placeholder="Search Drive"/>
      </header>
      <div class="Browser-subHeader">
        <div class="Browser-breadcrumbs">
          <span class="active">My Drive</span>
        </div>
      </div>
      <div class="Browser-body">
        <main class="Browser-content">
          ${Table({
            columns: [{
              name: 'Name',
              key: 'title'
            },
            {
              name: 'Owner',
              key: 'owner'
            },
            {
              name: 'Last modified',
              key: 'modifiedDate'
            },
            {
              name: 'File size',
              key: 'fileSize'
            }],
            folders: filteredFolders,
            files: filteredFiles,
            activeRow: props.activeRow,
            sortByTitle: props.sortByTitle,
            sortByDate: props.sortByDate,
            handleRowClick: props.handleRowClick,
            handleFileDoubleClick: props.addFile,
            handleFolderDoubleClick: props.getNextFolder
          })}
        </main>
      </div>
    </div>
  `
}
