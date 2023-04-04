import fs from 'node:fs/promises'

const CONFIG_FILE = new URL('./file.config', import.meta.url)

const raceInterval = setInterval(() => {
  fs.rm(CONFIG_FILE).catch(() => {})
})

const defaultConfig = {
  PORT: 8080,
  HOST: '127.0.0.1',
}

for (let i = 0; i < 999; i++) {
  const config = {}
  let configFile
  try {
    configFile = await fs.open(CONFIG_FILE, 'r')
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err
    Object.assign(config, defaultConfig)
    await fs.writeFile(
      CONFIG_FILE,
      Object.entries(defaultConfig)
        .map((k) => k.join('='))
        .join('\n'),
    )
    break
  }
  try {
    for await (const line of configFile.readLines()) {
      const [key, value] = line.split('=')
      config[key] = value
    }
  } finally {
    configFile?.close()
  }
}

clearInterval(raceInterval)
