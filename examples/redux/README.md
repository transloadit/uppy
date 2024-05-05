# Redux

This example uses Uppy with a Redux store. The same Redux store is also used for
other parts of the application, namely the counter example. Each action is
logged to the console using
[redux-logger](https://github.com/theaqua/redux-logger).

This example supports the
[Redux Devtools extension](https://github.com/zalmoxisus/redux-devtools-extension),
including time travel.

## Run it

To run this example, make sure you've correctly installed the **repository
root**:

```sh
corepack yarn install
corepack yarn build
```

That will also install the dependencies for this example.

Then, again in the **repository root**, start this example by doing:

```sh
corepack yarn workspace @uppy-example/redux start
```
