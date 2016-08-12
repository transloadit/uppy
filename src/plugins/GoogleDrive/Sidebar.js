import html from '../../core/html'

export default (props) => {
  return html`
    <ul class="UppyGoogleDrive-sidebar">
      <li class="UppyGoogleDrive-filter"><input class="UppyGoogleDrive-focusInput" type='text' onkeyup=${props.filterQuery} placeholder="Search.." value=${props.filterInput}/></li>
      <li><button onclick=${props.getRootDirectory}><img src="https://ssl.gstatic.com/docs/doclist/images/icon_11_collection_list_3.png"/> My Drive</button></li>
      <li><button><img src="https://ssl.gstatic.com/docs/doclist/images/icon_11_shared_collection_list_1.png"/> Shared with me</button></li>
      <li><button onclick=${props.logout}>Logout</button></li>
    </ul>
  `
}
