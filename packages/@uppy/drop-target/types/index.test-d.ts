import DropTarget = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = new Uppy()
 uppy.use(DropTarget, {
    target: 'body',
 })
}
