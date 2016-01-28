export default (context) => {
  const files = context.files.map(file => {
    return `<li><span>${file.image}</span><span>${file.name}</span></li>`
  }).join('')

  return `
    <section class='Modal-fileBrowser'>
      <h1>${context.provider}</h1>
      <h2>${context.currentDirectory}</h2>
      <ul>
        ${files}
      </ul>
    </section>
  `
}
