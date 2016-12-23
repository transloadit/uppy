const html = require('yo-yo')

module.exports = (props) => {
  return html`
    <tr class=${props.active ? 'is-active' : ''}
      onclick=${props.handleClick}
      ondblclick=${props.handleDoubleClick}>
      <td><span class="UppyGoogleDrive-folderIcon"><img src=${props.iconLink}/></span> ${props.title}</td>
      <td>Me</td>
      <td>${props.modifiedByMeDate}</td>
      <td>-</td>
    </tr>
  `
}
