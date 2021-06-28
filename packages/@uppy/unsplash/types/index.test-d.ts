import Unsplash = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = new Uppy()
 uppy.use(Unsplash, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
