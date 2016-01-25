import indexTemplate from '../templates/index.hbs';

console.log('handlebars template:')
console.log(
  indexTemplate({ users: ['John', 'Ira', 'Karl'] })
);
