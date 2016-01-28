import Sidebar from './sidebar'
import Browser from './browser'

export default () => {
  return `
    <section class='Modal'>
      ${Sidebar({
        providers: [{
          name: 'Local'
        },
        {
          name: 'Google Drive'
        }]
      })}
      ${Browser({
        files: [{ image: '123.png', name: '123.png' }],
        provider: 'Dropbox',
        currentDirectory: '/'
      })}
    </section>
  `
}
