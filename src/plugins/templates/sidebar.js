export default (context) => {
  const providers = context.providers.map(provider => {
    return `<li id="Uppy-${provider.name.split(' ').join('')}">${provider.name}</li>`
  }).join('')

  return `
    <section class='ModalSidebar'>
      <ul>
        ${providers}
      </ul>
    </section>
  `
}
