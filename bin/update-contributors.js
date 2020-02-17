const { execSync } = require('child_process')
const fs = require('fs')

const README_FILE_NAME = 'README.md'

async function updateContributorsListInReadme () {
  const readme = fs.readFileSync(README_FILE_NAME, 'utf-8')
  // const args = [
  //   '--owner', 'transloadit',
  //   '--repo', 'uppy',
  //   '--cols', '6',
  //   '--format', 'md',
  //   '--showLogin', 'true',
  //   '--sortOrder', 'desc'
  // ]

  // if (process.env.GITHUB_TOKEN) {
  //   args.push('--authToken', process.env.GITHUB_TOKEN)
  // }

  // const stdout = spawnSync('./node_modules/.bin/githubcontrib', args, { encoding: 'utf-8' }).stdout
  const stdout = execSync(
    './node_modules/.bin/githubcontrib --owner transloadit --repo uppy --cols 6 $([ \"${GITHUB_TOKEN:-}\" = \"\" ] && echo \"\" || echo \"--authToken ${GITHUB_TOKEN:-}\") --showlogin true --sortOrder desc', // eslint-disable-line
    { encoding: 'utf-8' }
  )
  console.log(stdout)
  if (stdout === '' || stdout === null) {
    console.log('Empty response from githubcontrib. GitHub’s rate limit?')
    return
  }
  const readmeWithUpdatedContributors = readme.replace(
    /<!--contributors-->[\s\S]+<!--\/contributors-->/,
    `<!--contributors-->\n${stdout}\n<!--/contributors-->`
  )
  fs.writeFileSync(README_FILE_NAME, readmeWithUpdatedContributors)
}

updateContributorsListInReadme()
