# React example

This is minimal example created to demonstrate how to integrate Uppy in your
React app.

To spawn the demo, use the following commands:

```sh
corepack yarn install
corepack yarn build
corepack yarn workspace @uppy-example/react dev
```

If you'd like to use a different package manager than Yarn  (e.g. npm) to work
with this example, you can extract it from the workspace like this:

```sh
corepack yarn workspace @uppy-example/react pack

# The above command should have create a .tgz file, we're going to extract it to
# a new directory outside of the Uppy workspace.
mkdir ../react-example
tar -xzf examples/react-example/package.tgz -C ../react-example --strip-components 1
rm -f examples/react-example/package.tgz

# Now you can leave the Uppy workspace and use the example as a standalone JS project:
cd ../react-example
npm i
npm run dev
```
