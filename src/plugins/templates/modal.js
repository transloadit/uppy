import Sidebar from './sidebar'
import Browser from './browser'

export default (opts) => {
  return `
    <section class='Modal'>
      ${Sidebar({
        providers: opts.providers
      })}
      ${Browser({
        files: [{ image: '123.png', name: '123.png' }],
        provider: 'Dropbox',
        currentDirectory: '/'
      })}
    </section>
  `
}
