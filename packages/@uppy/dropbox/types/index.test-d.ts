import Dropbox from '../'
import Uppy from '@uppy/core'

{
 const uppy = new Uppy()
 uppy.use(Dropbox, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
