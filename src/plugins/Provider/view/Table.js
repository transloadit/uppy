const Row = require('./TableRow')
const { h } = require('preact')

module.exports = (props) => {
  // const headers = props.columns.map((column) => {
  //   return html`
  //     <th class="uppy-ProviderBrowserTable-headerColumn uppy-ProviderBrowserTable-column" onclick=${props.sortByTitle}>
  //       ${column.name}
  //     </th>
  //   `
  // })

  // <thead class="uppy-ProviderBrowserTable-header">
  //   <tr>${headers}</tr>
  // </thead>

  return (
    <table class="uppy-ProviderBrowserTable" onscroll={props.handleScroll}>
      <tbody role="listbox" aria-label={`List of files from ${props.title}`}>
        {props.folders.map(folder => {
          let isDisabled = false
          let isChecked = props.isChecked(folder)
          if (isChecked) {
            isDisabled = isChecked.loading
          }
          return Row({
            title: props.getItemName(folder),
            type: 'folder',
            // active: props.activeRow(folder),
            getItemIcon: () => props.getItemIcon(folder),
            handleClick: () => props.handleFolderClick(folder),
            isDisabled: isDisabled,
            isChecked: isChecked,
            handleCheckboxClick: (e) => props.toggleCheckbox(e, folder),
            columns: props.columns
          })
        })}
        {props.files.map(file => {
          return Row({
            title: props.getItemName(file),
            type: 'file',
            // active: props.activeRow(file),
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
  )
}
