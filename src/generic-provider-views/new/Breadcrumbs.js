import html from '../../core/html'
import Breadcrumb from './Breadcrumb'

export default (props) => {
  return html`
    <ul class="UppyPlugin-breadcrumbs">
      ${
        props.directories.map((directory) => {
          return Breadcrumb({
            getFolder: () => props.getFolder(directory.id),
            title: directory.title
          })
        })
      }
    </ul>
  `
}
