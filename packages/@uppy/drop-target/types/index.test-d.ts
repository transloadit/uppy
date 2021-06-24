import DropTarget = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = Uppy()
 uppy.use(DropTarget, {
    target: 'body',
 })
}
