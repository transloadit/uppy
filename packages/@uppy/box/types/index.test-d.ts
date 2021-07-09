import Box from '../'
import Uppy from '@uppy/core'

{
 const uppy = new Uppy()
 uppy.use(Box, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
