import OneDrive = require('../')
import Uppy = require('@uppy/core')

{
 const uppy = Uppy()
 uppy.use(OneDrive, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
 })
}
