import Unsplash from '../'
import Uppy from '@uppy/core'

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
