var fs = require('fs');
import compileTemplate from 'lodash.template';
const indexTemplate = compileTemplate(fs.readFileSync('./templates/index-lodash.html', 'utf-8'));

console.log('lodash template:')
console.log(
  indexTemplate({ users: ['John', 'Ira', 'Karl'] })
);
