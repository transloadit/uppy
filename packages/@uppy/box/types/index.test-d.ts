import Box = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = Uppy()
 uppy.use(Box, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
