import Sidebar from './sidebar'

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
