var documentation = require('documentation');
var documentationFormatter = documentation.formats['md'];
var remark = require('remark');
var inject = require('mdast-util-inject');
var chalk = require('chalk');
var fs = require('fs');

var docOrder = ['Core', 'Translator', 'Plugin'];

documentation('../src/index.js', {order: docOrder}, function (err, comments) {
  if (err) console.log(err);

  documentationFormatter(comments, {}, function (err, output) {
    if (err) console.log(err);

    var inputMarkdownContent = remark.parse(fs.readFileSync('src/api/docs.md', 'utf-8'));
    var newStuff = remark.parse(output);
    inject('Uppy Core & Plugins', inputMarkdownContent, newStuff);

    fs.writeFileSync('src/api/docs.md', remark.stringify(inputMarkdownContent));
    console.info(chalk.green('✓ documentation generated'));
  });
});
