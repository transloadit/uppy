const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

const Row = require('./TableRow')

module.exports = (props) => {
  // const headers = props.columns.map((column) => {
  //   return html`
  //     <th class="BrowserTable-headerColumn BrowserTable-column" onclick=${props.sortByTitle}>
  //       ${column.name}
  //     </th>
  //   `
  // })

  // <thead class="BrowserTable-header">
  //   <tr>${headers}</tr>
  // </thead>

  return html`
    <table class="BrowserTable" onscroll=${props.handleScroll}>
      <tbody>
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
