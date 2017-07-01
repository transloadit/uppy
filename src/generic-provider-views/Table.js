const html = require('yo-yo')
const Row = require('./TableRow')

module.exports = (props) => {
  const headers = props.columns.map((column) => {
    return html`
      <th class="BrowserTable-headerColumn BrowserTable-column" onclick=${props.sortByTitle}>
        ${column.name}
      </th>
    `
  })

  return html`
    <table class="BrowserTable">
      <thead class="BrowserTable-header">
        <tr>
          ${headers}
        </tr>
      </thead>
      <tbody onscroll=${props.handleScroll}>
        ${props.folders.map((folder) => {
          return Row({
            title: props.getItemName(folder),
            active: props.activeRow(folder),
            getItemIcon: () => props.getItemIcon(folder),
            handleClick: () => props.handleFolderClick(folder),
            columns: props.columns
          })
        })}
        ${props.files.map((file) => {
          return Row({
            title: props.getItemName(file),
            active: props.activeRow(file),
            getItemIcon: () => props.getItemIcon(file),
            handleClick: () => props.handleFileClick(file),
            columns: props.columns
          })
        })}
      </tbody>
    </table>
  `
}
