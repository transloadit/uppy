<!-- WARNING! This file was injected. Please edit in ".github/CONTRIBUTING.md" instead and run "inject.js" -->

```

This data is used to generate Uppy's website. Refer to [the section about running the website locally](#website-previews) if you'd like to see how the docs look on the website.

### Adding an example

This is pretty simple to do, as you can likely use whatever code generation tool for your framework (ex. `create-react-app`) to create this example. Make sure you add the same version of `@uppy/core` to this as your peer dependency required, or you may run into strange issues. Try to include all of the components are some of their functionality. [The React example](https://github.com/transloadit/uppy/blob/master/examples/react-example/App.js) is a great... well example of how to do this well.

### Integrating the build system

The biggest part of this is understanding Uppy's build system. The high level description is basically `babel` goes through almost all of the packages and transpiles all the Javascript files in the `src` directory to more compatible JavaScript in the `lib` folder. If you're using vanilla JavaScript for your integration (like React and Vue do), then you can just use this build system and use the files generated as your entry points. 

If you're using some kind of more abstract file format (like Svelte), then you probably want do to a few things: add the directory name to [this `IGNORE` regex](https://github.com/transloadit/uppy/blob/425f9ecfbc8bc48ce6b734e4fc14fa60d25daa97/bin/build-lib.js#L15); add all of your build dependencies to the root `package.json` (try to keep this small); add a new `build:framework` script to the root `package.json`. This script usually looks something like this:

```json
{
  "scripts": {
    "build:framework": "cd framework && npm run build"
  }
}
```

Then, add this script to the `build:js` script. Try running the `build:js` script and make sure it does not error. It may also be of use to ensure that global dependencies aren't being used (ex. not having rollup locally and relying on a global install), as these dependencies won't be present on the machine's handling building.
