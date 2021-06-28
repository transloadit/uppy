import Facebook = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = new Uppy()
 uppy.use(Facebook, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
