import Instagram from '../'
import Uppy from '@uppy/core'

{
 const uppy = new Uppy()
 uppy.use(Instagram, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
