import Uppy from '@uppy/core'
import Url from '..'

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
      },
    },
  })
    .getPlugin<Url>('Url').addFile('https://via.placeholder.com/150')
}
