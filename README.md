# transloadit-js-client

A work in progress - nothing to see here.

## Design Goals
 
 - Support for IE10+??
 - Lightweight / easy on dependencies
 - tus.io enabled
 - ES6
 - Robust (retries / resumes for *all the things*), avoid showing 'weird errors'
 - Small core, pluggable architecture for adding more file sources: (webcam / google drive / dropbox / etc)
 - Themable UI with a beautiful default. UI is opt-out if people want to use just tus for instance

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
# For instant rebuilds, in a new tab, type:
npm run watch
```

This will `npm run build` the project into `./build`, and then serve that
directory using a simple static http server.
