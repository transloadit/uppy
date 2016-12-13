import html from '../../core/html'
import Breadcrumbs from './Breadcrumbs'
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
        <input
          type="text"
          class="Browser-search"
          placeholder="Search Drive"
          onkeyup=${props.filterQuery}
          value=${props.filterInput}/>
      </header>
      <div class="Browser-subHeader">
        ${Breadcrumbs({
          getNextFolder: props.getNextFolder,
          directories: props.directories
        })}
      </div>
      <div class="Browser-body">
        <main class="Browser-content">
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
            handleRowClick: props.handleRowClick,
            handleFileDoubleClick: props.addFile,
            handleFolderDoubleClick: props.getNextFolder,
            getFileName: props.getFileName
          })}
        </main>
      </div>
    </div>
  `
}
