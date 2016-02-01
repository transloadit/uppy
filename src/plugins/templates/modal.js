import Sidebar from './sidebar'

export default (opts) => {
  return `
    <section id='UppyModalDialog'>
      ${Sidebar({
        providers: opts.providers
      })}
      <div id='UppyModalContent'>
      </div>
    </section>
  `
}
