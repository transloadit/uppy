import Uppy from '@uppy/core'
import Url from '..'

{
  const uppy = new Uppy()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  uppy
    .use(Url, {
      companionUrl: '',
      companionCookiesRule: 'same-origin',
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
    .getPlugin<Url>('Url')!
    .addFile('https://via.placeholder.com/150')
}
