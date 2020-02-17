const { execSync } = require('child_process')
const fs = require('fs')

const README_FILE_NAME = 'README.md'

const readme = fs.readFileSync(README_FILE_NAME, 'utf-8')
const listOfContributors = execSync(
  './node_modules/.bin/githubcontrib --owner transloadit --repo uppy --cols 6 $([ \"${GITHUB_TOKEN:-}\" = \"\" ] && echo \"\" || echo \"--authToken ${GITHUB_TOKEN:-}\") --showlogin true --sortOrder desc', // eslint-disable-line
  { encoding: 'utf-8' }
)

const readmeWithUpdatedContributors = readme.replace(
  /<!--contributors-->[\s\S]+<!--\/contributors-->/,
  `<!--contributors-->\n${listOfContributors}\n<!--/contributors-->`
)

fs.writeFileSync(README_FILE_NAME, readmeWithUpdatedContributors)
