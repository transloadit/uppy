const parser = require('vue-template-compiler')
const fs = require('fs')
const path = require('path')
const { log } = require('console')

const root = path.join(process.cwd(), 'src')
const files  = fs.readdirSync(root)

files.forEach(name => {
  const filePath = path.join(root, name)
  const stat = fs.statSync(filePath)
  if(stat.isFile() && path.extname(filePath) === '.vue') {
    const file = fs.readFileSync(filePath)
    const parsed = parser.parseComponent(file.toString(), {
    })
    const template = parsed.template.content || ''

    const script = parsed.script.content
    const templateEscaped = template.trim().replace(/`/g, '\\`');
    const scriptWithTemplate = script.match(/export default ?\{/)
        ? script.replace(/export default ?\{/, `$&\n  template: \`${templateEscaped}\`,`)
        : `${script}\n export default {\n\ttemplate: \`\n${templateEscaped}\`};`;
      
    fs.writeFileSync(filePath + '.js', scriptWithTemplate)
  }
})