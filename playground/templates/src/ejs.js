import indexTemplate from '../templates/index.ejs';

console.log('ejs template:')
console.log(
  indexTemplate({ users: ['John', 'Ira', 'Karl'] })
);
