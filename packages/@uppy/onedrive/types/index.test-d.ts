import OneDrive from '../'
import Uppy from '@uppy/core'

{
 const uppy = new Uppy()
 uppy.use(OneDrive, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
