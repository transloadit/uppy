---
type: guide
order: 21
title: "FAQ"
---

## Why does your site look like vuejs.org?

The website is currently a clone of Yuxi Evan You's wonderful [Vue.js](http://vuejs.org/) website ([view license](website/VUEORG_LICENSE)) - just so we can hit the ground running in terms of Haxo boilerplate, etc. Obviously as soon as possible, we'll start rolling out our own layout & content and make this place our own. We'll keep the Vue website MIT license & credit in the footer in tact of course.

## What does Travis do?

Travis should:

- [x] check out code 
- [x] build project
- [ ] run unit tests
- [ ] run acceptance tests
- [x] copy/install the built project into any `examples/*/`
- [x] deploy the examples to our hackathon S3 bucket in a folder named by branch (http://hackathon.transloadit.com/uppy/master/index.html), so we can all play with the current state of the project & examples per branch, without installing everything locally.
