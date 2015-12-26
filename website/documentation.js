var documentation = require('documentation');
var documentationFormatter = documentation.formats['md'];
var fs = require('fs');

var docsFrontmatter = '---\ntype: api\norder: 1\ntitle: "Generated API Docs"\n---\n';

// documentation('../src/index.js', {}, function (err, comments) {
//   documentationFormatter(comments, {}, function (err, output) {
//     var docsWithFrontmatter = docsFrontmatter + output;
//     // console.log(docsWithFrontmatter);
//     fs.writeFileSync('src/api/docs.md', docsWithFrontmatter);
//     console.log('documentation generated');
//   });
// });

var remark = require('remark');
var inputMarkdownContent = fs.readFileSync('src/api/docs.md', 'utf-8');
var docjsReadme = require('documentation-readme/lib/plugin');
remark().use(docjsReadme, {
 section: 'Uppy Core & Plugins', // inject into the ## Usage section of the input doc
 documentationArgs: [ '../src/index.js' ]
}).process(inputMarkdownContent, function (err, vfile, content) {
fs.writeFileSync('src/api/docs.md', content);
 // console.log(content);
 console.log('documentation generated');
});
