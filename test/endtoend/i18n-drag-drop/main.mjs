import Uppy from '@uppy/core'
import DragDrop from '@uppy/drag-drop'
import XHRUpload from '@uppy/xhr-upload'
import ProgressBar from '@uppy/progress-bar'

import DeepFrozenStore from '../../resources/DeepFrozenStore.js'

const uppyi18n = new Uppy({
  id: 'uppyi18n',
  debug: true,
  autoProceed: true,
  store: DeepFrozenStore(),
})

uppyi18n
  .use(DragDrop, {
    target: '#uppyi18n',
    locale: {
      strings: {
        dropHereOr: 'Перенесите файлы сюда или %{browse}',
        browse: 'выберите',
      },
    },
  })
  .use(ProgressBar, { target: '#uppyi18n-progress' })
  .use(XHRUpload, { endpoint: 'https://xhr-server.herokuapp.com/upload' })
