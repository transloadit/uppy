# transloadit-js-client

A work in progress - nothing to see here.

## Design Goals
 
 - Support for IE10+??
 - Lightweight / easy on dependencies
 - tus.io enabled
 - ES6
 - Robust (retries / resumes for *all the things*), avoid showing 'weird errors'
 - Themable UI with a beautiful default
 - Compatible with React
 - Small core, modular plugin architecture for everything: (modal / dragdrop / themes/ webcam / google drive / dropbox / etc)
 - Offering sugared shortcuts for novice users

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
