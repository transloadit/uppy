import html from '../../../core/html'
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
            title: folder.path,
            active: props.activeRow === folder.rev,
            icon: folder.icon,
            modifiedByMeDate: folder.modifiedByMeDate,
            handleClick: () => props.handleRowClick(folder.rev),
            handleDoubleClick: () => props.handleFolderDoubleClick(folder.rev, folder.path),
            columns: props.columns
          })
        })}
        ${props.files.map((file) => {
          return Row({
            title: file.path,
            active: props.activeRow === file.rev,
            icon: file.icon,
            modifiedByMeDate: file.modifiedByMeDate,
            handleClick: () => props.handleRowClick(file.rev),
            handleDoubleClick: () => props.handleFileDoubleClick(file),
            columns: props.columns,
            owner: 'Joe Mama'
          })
        })}
      </tbody>
    </table>
  `
}
