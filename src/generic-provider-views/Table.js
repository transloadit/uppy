const html = require('yo-yo')
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
      <tbody role="listbox" aria-label="List of files from ${props.title}">
        ${props.folders.map((folder) => {
          let isDisabled = false
          let isChecked = props.isChecked(folder)
          if (isChecked) {
            isDisabled = isChecked.loading
          }
          return Row({
            title: props.getItemName(folder),
            active: props.activeRow(folder),
            getItemIcon: () => props.getItemIcon(folder),
            handleClick: () => props.handleFolderClick(folder),
            isDisabled: isDisabled,
            isChecked: isChecked,
            handleCheckboxClick: (e) => props.toggleCheckbox(e, folder),
            columns: props.columns
          })
        })}
        ${props.files.map((file) => {
          return Row({
            title: props.getItemName(file),
            active: props.activeRow(file),
            getItemIcon: () => props.getItemIcon(file),
            handleClick: () => props.handleFileClick(file),
            isDisabled: false,
            isChecked: props.isChecked(file),
            handleCheckboxClick: (e) => props.toggleCheckbox(e, file),
            columns: props.columns
          })
        })}
      </tbody>
    </table>
  `
}
