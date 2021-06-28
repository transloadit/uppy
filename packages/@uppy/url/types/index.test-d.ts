import Uppy = require('@uppy/core')
import Url = require('../')

{
 const uppy = new Uppy()
 uppy.use(Url, {
    companionUrl: '',
    companionCookiesRule: 'same-origin',
    replaceTargetContent: false,
    target: 'body',
    title: 'title',
    locale: {
      strings: {
        import: '',
        enterUrlToImport: '',
        failedToFetch: '',
        enterCorrectUrl: '',
      }
    }
 })
 .getPlugin<Url>('Url').addFile('https://via.placeholder.com/150')
}
