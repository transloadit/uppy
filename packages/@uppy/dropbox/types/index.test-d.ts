import Dropbox = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = Uppy()
 uppy.use(Dropbox, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
