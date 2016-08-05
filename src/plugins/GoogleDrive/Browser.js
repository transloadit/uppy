import yo from 'yo-yo'
import BrowserRow from './BrowserRow'

export default (props, bus) => {
  let folders = props.folders
  let files = props.files
  let previewElem = ''
  const isFileSelected = Object.keys(props.active).length !== 0 && JSON.stringify(props.active) !== JSON.stringify({})

  if (props.filterInput !== '') {
    folders = this.filterItems(props.folders)
    files = this.filterItems(props.files)
  }

  folders = folders.map((folder) => BrowserRow(folder))
  files = files.map((file) => BrowserRow(file))

  const breadcrumbs = props.directory.map((dir) => yo`<li><button onclick=${this.getNextFolder.bind(this, dir.id, dir.title)}>${dir.title}</button></li> `)
  if (isFileSelected) {
    previewElem = yo`
      <div>
        <h1><span class="UppyGoogleDrive-fileIcon"><img src=${props.active.iconLink}/></span>${props.active.title}</h1>
        <ul>
          <li>Type: ${this.getFileType(props.active)}</li>
          <li>Modified By Me: ${props.active.modifiedByMeDate}</li>
        </ul>
        ${props.active.thumbnailLink ? yo`<img src=${props.active.thumbnailLink} class="UppyGoogleDrive-fileThumbnail" />` : yo``}
      </div>
    `
  }

  return yo`
    <div>
      <div class="UppyGoogleDrive-header">
        <ul class="UppyGoogleDrive-breadcrumbs">
          ${breadcrumbs}
        </ul>
      </div>
      <div class="container-fluid">
        <div class="row">
          <div class="hidden-md-down col-lg-3 col-xl-3">
            <ul class="UppyGoogleDrive-sidebar">
              <li class="UppyGoogleDrive-filter"><input class="UppyGoogleDrive-focusInput" type='text' onkeyup=${this.filterQuery} placeholder="Search.." value=${props.filterInput}/></li>
              <li><button onclick=${this.getNextFolder.bind(this, 'root', 'My Drive')}><img src="https://ssl.gstatic.com/docs/doclist/images/icon_11_collection_list_3.png"/> My Drive</button></li>
              <li><button><img src="https://ssl.gstatic.com/docs/doclist/images/icon_11_shared_collection_list_1.png"/> Shared with me</button></li>
              <li><button onclick=${this.logout}>Logout</button></li>
            </ul>
          </div>
          <div class="col-md-12 col-lg-9 col-xl-6">
            <div class="UppyGoogleDrive-browserContainer">
              <table class="UppyGoogleDrive-browser">
                <thead>
                  <tr>
                    <td class="UppyGoogleDrive-sortableHeader" onclick=${this.sortByTitle}>Name</td>
                    <td>Owner</td>
                    <td class="UppyGoogleDrive-sortableHeader" onclick=${this.sortByDate}>Last Modified</td>
                    <td>Filesize</td>
                  </tr>
                </thead>
                <tbody>
                  ${folders}
                  ${files}
                </tbody>
              </table>
            </div>
          </div>
          <div class="hidden-lg-down col-xl-2">
            <div class="UppyGoogleDrive-fileInfo">
              ${previewElem}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
