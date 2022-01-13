import prompts from 'prompts'
import fs from 'node:fs/promises'
import dedent from 'dedent'

;(async () => {
  const packageNames = await fs.readdir(new URL('../packages/@uppy', import.meta.url))
  const unwantedPackages = ['companion', 'redux-dev-tools', 'utils']

  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: 'What should the name of the test be (e.g `dashboard-tus`)?',
    validate: (value) => /^[a-z|-]+$/i.test(value),
  })

  const { packages } = await prompts({
    type: 'multiselect',
    name: 'packages',
    message: 'What packages do you want to test?',
    choices: packageNames
      .filter((name) => !unwantedPackages.includes(name))
      .map((name) => ({ title: name, value: name })),
  })

  const camelcase = (str) =>
    str
      .toLowerCase()
      .replace(/([-][a-z])/g, (group) => group.toUpperCase().replace('-', ''))

  const testUrl = new URL(`cypress/integration/${name}.spec.ts`, import.meta.url)
  const test = dedent`
    ${packages.map((pgk) => `import ${camelcase(pgk)} from '@uppy/${pgk}'\n`)}
    describe('${name}', () => {
      beforeEach(() => {
        cy.visit('/${name}')
      })
    })
  `
  const htmlUrl = new URL(`clients/${name}/index.html`, import.meta.url)
  const html = dedent`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <title>${name}</title>
        <script defer type="module" src="app.js"></script>
      </head>
      <body>
        <div id="app"></div>
      </body>
    </html>
  `

  const appUrl = new URL(`clients/${name}/app.js`, import.meta.url)
  const app = dedent`
    ${packages.map((pgk) => `import ${camelcase(pgk)} from '@uppy/${pgk}'\n`)}
    const uppy = new Uppy()
      ${packages.map((pkg) => `.use(${camelcase(pkg)})`)}

    // Keep this here to access uppy in tests
    window.uppy = uppy
  `

  await fs.writeFile(testUrl, test)
  await fs.mkdir(new URL(`clients/${name}`, import.meta.url))
  await fs.writeFile(htmlUrl, html)
  await fs.writeFile(appUrl, app)

  const homeUrl = new URL('clients/index.html', import.meta.url)
  const home = await fs.readFile(homeUrl, 'utf8')
  const newHome = home.replace('</ul>', `\t<li><a href="${name}/index.html">${name}</a></li>\n\t\t\t</ul>`)
  await fs.writeFile(homeUrl, newHome)

  const prettyPath = url => url.toString().split('uppy')[1]

  console.log(`✅ Generated ${prettyPath(testUrl)}`)
  console.log(`✅ Generated ${prettyPath(htmlUrl)}`)
  console.log(`✅ Generated ${prettyPath(appUrl)}`)
  console.log(`✅ Updated ${prettyPath(homeUrl)}`)
})()
