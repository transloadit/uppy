import yo from 'yo-yo'
import Breadcrumb from './Breadcrumb'

export default (props) => {
  console.log(props.directories)
  return yo`
    <ul class="UppyGoogleDrive-breadcrumbs">
      ${
        props.directories.map((directory) => {
          return Breadcrumb({
            getNextFolder: () => props.getNextFolder(directory.id, directory.title),
            title: directory.title
          })
        })
      }
    </ul>
  `
}
