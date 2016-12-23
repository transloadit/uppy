const html = require('yo-yo')
const TableRow = require('./TableRow')

module.exports = (props) => {
  return html`
    <table class="UppyGoogleDrive-browser">
      <thead>
        <tr>
          <td class="UppyGoogleDrive-sortableHeader" onclick=${props.sortByTitle}>Name</td>
          <td>Owner</td>
          <td class="UppyGoogleDrive-sortableHeader" onclick=${props.sortByDate}>Last Modified</td>
          <td>Filesize</td>
        </tr>
      </thead>
      <tbody>
        ${props.folders.map((folder) => {
          return TableRow({
            title: folder.title,
            active: props.activeRow === folder.id,
            iconLink: folder.iconLink,
            modifiedByMeDate: folder.modifiedByMeDate,
            handleClick: () => props.handleRowClick(folder.id),
            handleDoubleClick: () => props.handleFolderDoubleClick(folder.id, folder.title)
          })
        })}
        ${props.files.map((file) => {
          return TableRow({
            title: file.title,
            active: props.activeRow === file.id,
            iconLink: file.iconLink,
            modifiedByMeDate: file.modifiedByMeDate,
            handleClick: () => props.handleRowClick(file.id),
            handleDoubleClick: () => props.handleFileDoubleClick(file)
          })
        })}
      </tbody>
    </table>
  `
}
