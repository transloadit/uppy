import Zoom = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = Uppy()
 uppy.use(Zoom, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
