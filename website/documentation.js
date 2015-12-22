var documentation = require('documentation');
var documentationFormatter = documentation.formats['md'];
var fs = require('fs');

var docsFrontmatter = '---\ntype: api\norder: 1\ntitle: "Generated API Docs"\n---\n';

documentation('../src/core/Core.js', {}, function (err, comments) {
  documentationFormatter(comments, {}, function (err, output) {
    var docsWithFrontmatter = docsFrontmatter + output;
    // console.log(docsWithFrontmatter);
    fs.writeFileSync('src/api/docs.md', docsWithFrontmatter);
    console.log('documentation generated');
  });
});
