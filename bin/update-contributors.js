const execa = require('execa')
const fs = require('fs')

const README_FILE_NAME = 'README.md'

async function updateContributorsListInReadme () {
  const readme = fs.readFileSync(README_FILE_NAME, 'utf-8')
  const args = [
    '--owner', 'transloadit',
    '--repo', 'uppy',
    '--cols', '6',
    '--authToken', process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN : ''
  ]
  const { stdout } = await execa('githubcontrib', args) // eslint-disable-line
  const readmeWithUpdatedContributors = readme.replace(
    /<!--contributors-->[\s\S]+<!--\/contributors-->/,
    `<!--contributors-->\n${stdout}\n<!--/contributors-->`
  )
  fs.writeFileSync(README_FILE_NAME, readmeWithUpdatedContributors)
}

updateContributorsListInReadme()
