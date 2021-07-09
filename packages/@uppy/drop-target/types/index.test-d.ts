import DropTarget from '../'
import Uppy from '@uppy/core'

{
 const uppy = new Uppy()
 uppy.use(DropTarget, {
    target: 'body',
 })
}
