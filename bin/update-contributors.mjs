import { spawn } from "node:child_process"
import fs from "node:fs/promises"

const README_FILE_NAME = new URL("../README.md", import.meta.url)

const readme = await fs.open(README_FILE_NAME, "r+")
const readmeContent = await readme.readFile()

const githubcontrib = spawn("npx", [
    'githubcontrib',
    '--owner', 'transloadit',
    '--repo', 'uppy',
    '--cols', '6',
    '--format', 'md',
    '--showlogin', 'true',
    '--sortOrder', 'desc',
  ], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });

githubcontrib.on('error', console.error)

// Detect start of contributors section.
const START_TAG = Buffer.from("<!--contributors-->\n")
let START_TAG_POSITION = readmeContent.indexOf(START_TAG) + START_TAG.byteLength

let cursor = START_TAG_POSITION
for await (const data of githubcontrib.stdout) {
  const { bytesWritten } = await readme.write(data.toString('utf-8'), cursor, "utf-8")
  cursor += bytesWritten
}

if(cursor === START_TAG_POSITION) {
  console.log('Empty response from githubcontrib. GitHub’s rate limit?')
  await readme.close()
  process.exit(1)
}

// Write the end of the file.
await readme.write(
  readmeContent,
  readmeContent.indexOf("<!--/contributors-->"),
  undefined,
  cursor
)
await readme.close()
