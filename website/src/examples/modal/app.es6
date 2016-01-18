import Uppy from 'uppy/core'
import { DragDrop, Tus10 } from 'uppy/plugins'

const defaults = {
  width: 380, // max = 640
  height: 280, // max = 350
  showClose: false,
  showCloseText: '',
  closeByEscape: true,
  closeByDocument: true,
  holderClass: '',
  overlayClass: '',
  enableStackAnimation: false,
  onBlurContainer: '',
  openOnEvent: true,
  setEvent: 'click',
  onLoad: false,
  onUnload: false,
  onClosing: false,
  template: '<p>This is test popin content!</p>'
};

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('avgrund-ready')

  const trigger = document.querySelector('.ModalTrigger')
  trigger.addEventListener('click', (e) => {
    let overlayElem = document.createElement('div')
    overlayElem.classList.add('avgrund-overlay')
    document.body.appendChild(overlayElem)

    overlayElem.addEventListener('click', onDocumentClick)
    activate();
  })
})

function onDocumentKeyup (e) {
  if (e.keyCode === 27) {
    deactivate();
  }
}

function onDocumentClick (e) {
  e.preventDefault();
  deactivate();
}

function activate (e) {
  setTimeout(function () {
    document.body.classList.toggle('avgrund-ready');
    document.body.classList.toggle('avgrund-active');
  }, 100);

  var popin = document.createElement('div');
  popin.classList.add('avgrund-popin');
  popin.classList.add('ModalWindow');

  popin.innerHTML = defaults.template;
  console.log(defaults.template)

  var a  = document.createElement('a')
  var linkText = document.createTextNode("close")
  a.appendChild(linkText)
  a.classList.add('avgrund-close')
  a.href = '#'

  popin.appendChild(a)

  document.body.appendChild(popin);
  a.addEventListener('click', onDocumentClick)
}

function deactivate () {
  document.body.classList.toggle('avgrund-ready');
  document.body.classList.toggle('avgrund-active');

  setTimeout(function () {
      var el = document.querySelector('.avgrund-popin')
      el.remove();
  }, 500);
}
