// import Uppy from 'uppy/core'
// import { DragDrop, Tus10 } from 'uppy/plugins'
import { Authorize, Browser, Modal, Sidebar } from './partials'
console.log('here we go')
console.log(Modal())

const defaults = {
  width               : 380, // max = 640
  height              : 280, // max = 350
  showClose           : false,
  showCloseText       : '',
  closeByEscape       : true,
  closeByDocument     : true,
  holderClass         : '',
  overlayClass        : '',
  enableStackAnimation: false,
  onBlurContainer     : '',
  openOnEvent         : true,
  setEvent            : 'click',
  onLoad              : false,
  onUnload            : false,
  onClosing           : false,
  template            : '<p>This is test popin content!</p>'
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('avgrund-ready')

  const trigger = document.querySelector('.ModalTrigger')
  trigger.addEventListener('click', (e) => {
    let overlayElem = document.createElement('div')
    overlayElem.classList.add('avgrund-overlay')
    document.body.appendChild(overlayElem)

    overlayElem.addEventListener('click', onDocumentClick)
    activate()

    var driveButton = document.getElementById('GoogleDriveTrigger')
    driveButton.addEventListener('click', function(e) {
      fetch('http://localhost:3002/drive/auth/authorize', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(function(res) {
        res.text().then(function(data) {
          const target = document.querySelector('.UploadContent')

          target.innerHTML = '<a href="' + data + '" target="_blank">Click here to authorize</a>'
        })
      })

    })
  })
})

// function onDocumentKeyup (e) {
//   if (e.keyCode === 27) {
//     deactivate()
//   }
// }

function onDocumentClick (e) {
  e.preventDefault()
  deactivate()
}

function activate (e) {
  setTimeout(function () {
    document.body.classList.toggle('avgrund-ready')
    document.body.classList.toggle('avgrund-active')
  }, 100)

  var popin = document.createElement('div')
  popin.classList.add('avgrund-popin')
  popin.classList.add('ModalWindow')
  var template = '<div class="ModalTemplate"><nav class="UploadSidebar"><ul class="InputList"><li><button>Local</button></li><li><button id="GoogleDriveTrigger">Google Drive</button></li><li><button>Instagram</button></li><li><button>Dropbox</button></li><li><button>Webcam</button></li></ul></nav><main class="UploadContent"></main></div>'
  popin.innerHTML = template
  console.log(template)

  var a  = document.createElement('a')
  var linkText = document.createTextNode('close')
  a.appendChild(linkText)
  a.classList.add('avgrund-close')
  a.href = '#'

  popin.appendChild(a)

  document.body.appendChild(popin)
  a.addEventListener('click', onDocumentClick)
}

function deactivate () {
  document.body.classList.toggle('avgrund-ready')
  document.body.classList.toggle('avgrund-active')

  setTimeout(function () {
    var el = document.querySelector('.avgrund-popin')
    el.remove()
  }, 500)
}


