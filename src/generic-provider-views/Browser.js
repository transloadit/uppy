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
          getFolder: props.getFolder,
          directories: props.directories
        })}
        <button onclick=${props.logout} class="Browser-userLogout">Log out</button>
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
            // handleRowClick: props.handleRowClick,
            handleFileClick: props.addFile,
            handleFolderClick: props.getNextFolder,
            getItemName: props.getItemName,
            getItemIcon: props.getItemIcon
          })}
        </main>
      </div>
    </div>
  `
}
