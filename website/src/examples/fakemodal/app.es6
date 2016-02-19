import Uppy from '../../../../src/core/Core.js'
import Dummy from '../../../../src/plugins/Dummy.js'
import FakeModal from '../../../../src/plugins/FakeModal.js'

const uppy = new Uppy({debug: true})
uppy
  .use(FakeModal)
  .use(Dummy, {target: FakeModal})
  .run()
