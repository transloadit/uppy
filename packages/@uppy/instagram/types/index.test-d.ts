import Instagram = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = Uppy()
 uppy.use(Instagram, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
