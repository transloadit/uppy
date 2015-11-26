# transloadit-js-client

A work in progress - nothing to see here.

## Design Goals
 
 - Support for IE10+?? (decide what our entry level IE is, it's okay to have a cut-off if that results in a more focused higher quality codebase. older browsers will need to opt for our jquery-sdk)
 - Lightweight / easy on dependencies
 - tus.io enabled
 - ES6
 - Robust (retries / resumes for *all the things*), avoid showing 'weird errors'
 - Themable UI with a beautiful default
 - Compatible with React (Native)
 - Should work great on mobile
 - Small core, modular plugin architecture for everything: (modal / dragdrop / themes/ webcam / google drive / dropbox / etc)
 - Offering sugared shortcuts for novice users (presets)

Check [open issues](https://github.com/transloadit/transloadit-js-client/milestones/Minimum%20Viable%20Product) for our Minimum Viable Product. 

## Local Development

First clone and install the project:

```bash
git clone git@github.com:transloadit/transloadit-js-client.git
cd transloadit-js-client
npm install
```

Now to get a sandbox environment set up, type:

```bash
npm run preview
```

This will `npm run build` the project into `./build`, and then serve that
directory using a simple static http server.


## What does Travis do?

Travis should:

- [x] check out code 
- [x] build project
- [ ] run unit tests
- [ ] run acceptance tests
- [x] copy/install the built project into any `examples/*/`
- [x] deploy the examples to our hackathon S3 bucket in a folder named by branch (http://hackathon.transloadit.com/transloadit-js-client/master/index.html), so we can all play with the current state of the project & examples per branch, without installing everything locally.
