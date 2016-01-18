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

  // if ($('.avgrund-overlay').length === 0) {
  //   body.append('<div class="avgrund-overlay ' + options.overlayClass + '"></div>');
  // }

// $(options.onBlurContainer).addClass('avgrund-blur');

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
  console.log('keyclick')
  if (options.closeByEscape) {
    if (e.keyCode === 27) {
      deactivate();
    }
  }
}

function onDocumentClick (e) {
  console.log('documentclick')

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

  // document.body.addEventListener('keyup', document)
    // body.bind('keyup', onDocumentKeyup)
    //     .bind('click', onDocumentClick);
    function deactivate () {
      document.body.classList.toggle('avgrund-ready');
      document.body.classList.toggle('avgrund-active');

      setTimeout(function () {
          var el = document.querySelector('.avgrund-popin')
          el.remove();
      }, 500);
    }


/**
 *  jQuery Avgrund Popin Plugin
 *  http://github.com/voronianski/jquery.avgrund.js/
 *
 *  (c) http://pixelhunter.me/
 *  MIT licensed
 */

// (function (factory) {
//     if (typeof define === 'function' && define.amd) {
//         // AMD
//         define(['jquery'], factory);
//     } else if (typeof exports === 'object') {
//         // CommonJS
//         module.exports = factory;
//     } else {
//         // Browser globals
//         factory(jQuery);
//     }
// }(function ($) {
//     $.fn.avgrund = function (options) {


//         options = $.extend(defaults, options);

//         return this.each(function () {
//             var self = $(this),
//                 body = $('body'),
//                 maxWidth = options.width > 640 ? 640 : options.width,
//                 maxHeight = options.height > 350 ? 350 : options.height,
//                 template = typeof options.template === 'function' ? options.template(self) : options.template;

//             body.addClass('avgrund-ready');

//             if ($('.avgrund-overlay').length === 0) {
//                 body.append('<div class="avgrund-overlay ' + options.overlayClass + '"></div>');
//             }

//             if (options.onBlurContainer !== '') {
//                 $(options.onBlurContainer).addClass('avgrund-blur');
//             }

//             if (options.openOnEvent) {
//                 self.bind(options.setEvent, function (e) {
//                     e.stopPropagation();

//                     if ($(e.target).is('a')) {
//                         e.preventDefault();
//                     }

//                     activate();
//                 });
//             } else {
//                 activate();
//             }
//         });
//     };
// }));
