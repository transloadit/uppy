import transloadit from './transloadit-core';
import dragndrop from './transloadit-dragndrop';
import instagram from './transloadit-instagram';

transloadit()
  .use(dragndrop, {
    selector: '.drop'
  })
  .use(instagram, {})
  .set({someOption: true})
