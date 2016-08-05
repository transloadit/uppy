import yo from 'yo-yo'

export default (props, bus) => {
  const state = this.core.getState().googleDrive
  const isAFileSelected = Object.keys(state.active).length !== 0 && JSON.stringify(state.active) !== JSON.stringify({})
  const isFolder = props.mimeType === 'application/vnd.google-apps.folder'
  return yo`
    <tr class=${(isAFileSelected && state.active.id === props.id) ? 'is-active' : ''}
      onclick=${this.handleClick.bind(this, props)}
      ondblclick=${isFolder ? this.getNextFolder.bind(this, props.id, props.title) : this.addFile.bind(this, props)}>
      <td><span class="UppyGoogleDrive-folderIcon"><img src=${props.iconLink}/></span> ${props.title}</td>
      <td>Me</td>
      <td>${props.modifiedByMeDate}</td>
      <td>-</td>
    </tr>
  `
}
