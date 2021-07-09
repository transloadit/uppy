import Facebook from '../'
import Uppy from '@uppy/core'

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
