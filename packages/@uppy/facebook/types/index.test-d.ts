import Facebook = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = Uppy()
 uppy.use(Facebook, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
