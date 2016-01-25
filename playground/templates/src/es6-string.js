var fs = require('fs');
const indexTemplate = fs.readFileSync('./templates/index-string.js', 'utf-8');

const users = ['John', 'Ira', 'Karl'];

console.log('es6 string template:')
console.log(
  eval(indexTemplate)
);
