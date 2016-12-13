import html from '../../core/html'
import Row from './TableRow'

export default (props) => {
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
      <tbody>
        ${props.folders.map((folder) => {
          return Row({
            title: props.getFileName(folder),
            active: props.activeRow(folder),
            icon: folder.icon,
            handleClick: () => props.handleRowClick(folder),
            handleDoubleClick: () => props.handleFolderDoubleClick(folder),
            columns: props.columns
          })
        })}
        ${props.files.map((file) => {
          return Row({
            title: props.getFileName(file),
            active: props.activeRow(file),
            icon: file.icon,
            handleClick: () => props.handleRowClick(file),
            handleDoubleClick: () => props.handleFileDoubleClick(file),
            columns: props.columns,
            owner: 'Joe Mama'
          })
        })}
      </tbody>
    </table>
  `
}
