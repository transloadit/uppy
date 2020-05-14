const getFileTypeIcon = require('../utils/getFileTypeIcon')
const { h, Component } = require('preact')

const Cropper = require('cropperjs')

// module.exports = function FilePreview (props) {
//   const file = props.file

//   if (file.preview) {
//     return <img class="uppy-DashboardItem-previewImg" alt={file.name} src={file.preview} />
//   }

//   const { color, icon } = getFileTypeIcon(file.type)

//   return (
//     <div class="uppy-DashboardItem-previewIconWrap">
//       <span class="uppy-DashboardItem-previewIcon" style={{ color: color }}>{icon}</span>
//       <svg aria-hidden="true" focusable="false" class="uppy-DashboardItem-previewIconBg" width="58" height="76" viewBox="0 0 58 76"><rect fill="#FFF" width="58" height="76" rx="3" fill-rule="evenodd" /></svg>
//     </div>
//   )
// }

module.exports = class FilePreview extends Component {
  componentDidMount () {
    const file = this.props.file
    if (file.preview) {
      const cropper = new Cropper(this.img, {
        aspectRatio: 16 / 9,
        crop (event) {
          console.log(event.detail.x)
          console.log(event.detail.y)
          console.log(event.detail.width)
          console.log(event.detail.height)
          console.log(event.detail.rotate)
          console.log(event.detail.scaleX)
          console.log(event.detail.scaleY)
        }
      })

      setTimeout(() => {
        cropper.getCroppedCanvas().toBlob((blob) => {
          console.log(blob)
          this.props.uppy.setFileState(file.id, {
            data: blob,
            preview: null
          })
          const updatedFile = this.props.uppy.getFile(file.id)
          this.props.uppy.emit('thumbnail:request', updatedFile)
        })
      }, 5000)
    }
  }

  render () {
    const file = this.props.file

    if (file.preview) {
      return (
        <img
          class="uppy-DashboardItem-previewImg"
          alt={file.name}
          src={file.preview}
          ref={(ref) => { this.img = ref }}
        />
      )
    }

    const { color, icon } = getFileTypeIcon(file.type)

    return (
      <div class="uppy-DashboardItem-previewIconWrap">
        <span class="uppy-DashboardItem-previewIcon" style={{ color: color }}>{icon}</span>
        <svg aria-hidden="true" focusable="false" class="uppy-DashboardItem-previewIconBg" width="58" height="76" viewBox="0 0 58 76"><rect fill="#FFF" width="58" height="76" rx="3" fill-rule="evenodd" /></svg>
      </div>
    )
  }
}
