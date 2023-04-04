import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

const bmp = await readFile('/Users/duhamean/Downloads/bmp_.bmp')

async function writeBMP (r, g, b) {
  bmp[bmp.length - 2] = r
  bmp[bmp.length - 3] = g
  bmp[bmp.length - 4] = b

  const cp = spawn('magick', ['-', `/Users/duhamean/Documents/transloadit/uppy/website/public/pics/p${r}${g}${b}.png`], {
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  cp.stdin.end(bmp)
  await once(cp, 'exit')
}

for (let r = 0; r < 256; r += Math.ceil(Math.random() * 15)) {
  for (let g = 0; g < 256; g += Math.ceil(Math.random() * 15)) {
    for (let b = 0; b < 256; b += Math.ceil(Math.random() * 15)) {
      await writeBMP(r, g, b)
    }
  }
}
