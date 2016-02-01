import Sidebar from './sidebar'
import Browser from './browser'

export default (opts) => {
  return `
    <section class='Modal'>
      ${Sidebar({
        providers: opts.providers
      })}
      <div id='UppyModalContent'>
      </div>
    </section>
  `
}
