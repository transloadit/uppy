// window.Transloadit = function (selector) {
//   var el    = document.querySelector(selector);
//   var inner = ''
//   inner += '<div class="transloadit-js-client">';
//   inner += 'Hello world :)';
//   inner += 'I am the new Transloadit js client, and as you can see, I need to be improved badly :)';
//   inner += '</div>';
//   el.innerHTML = inner;
// };

import transloadit from './transloadit-core';
import dragndrop from './transloadit-dragndrop';
import instagram from './transloadit-instagram';

transloadit()
  .use(dragndrop, {
    selector: '.drop'
  })
  .use(instagram, {})
  .set({someOption: true});
