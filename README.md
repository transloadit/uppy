# uppy

A work in progress - nothing to see here.

Check [open issues](https://github.com/transloadit/uppy/milestones/Minimum%20Viable%20Product) for our Minimum Viable Product. 

## Uppy Development

First clone and install the project:

```bash
git clone git@github.com:transloadit/uppy.git
cd uppy
npm install
```

Now to get a sandbox environment set up, type:

```bash
npm run preview
```

This will `npm run build` the project into `./build`, and then serve that
directory using a simple static http server.

## Website Development

We keep the [uppyjs.io](http://uppyjs.io) website in `./website` for so it's easy to keep docs & code in sync as we're still iterating at high velocity. For those reading this and screaming murder, [HashiCorp does this](https://github.com/hashicorp/terraform/tree/master/website) for all their projects, and it working well for them on a scale vastly more impressive than ours.

The site is built with [Hexo](http://hexo.io/), and Travis automatically deploys this onto GitHub Pages (it overwrites the [`gh-pages`](https://github.com/transloadit/uppy/tree/gh-pages) branch at every deploy).

Content is written in Markdown and located in `./website/src`. Pull requests welcome!
  
> The website is currently a clone of Yuxi Evan You's [Vue.js](http://vuejs.org/) website ([view license](website/LICENSE)) - just so we can hit the ground rolling in terms of setting up Haxo etc. Obviously as soon as possible, we should start rolling out our own layout & content.

`./website/update.js` is called during website builds to inject the Uppy versions & filesizes into the documentation. `website` in an independent folder and so it cannot rely on anything from the root project, without `update.js` explicitly making it available (copying).

It's recommended to exclude `./website/public/` from your editor if you want efficient searches.

For local previews on `http://127.0.0.1:4000` type:

```bash
make website-preview
```

## FAQ

### What does Travis do?

Travis should:

- [x] check out code 
- [x] build project
- [ ] run unit tests
- [ ] run acceptance tests
- [x] copy/install the built project into any `examples/*/`
- [x] deploy the examples to our hackathon S3 bucket in a folder named by branch (http://hackathon.transloadit.com/uppy/master/index.html), so we can all play with the current state of the project & examples per branch, without installing everything locally.
