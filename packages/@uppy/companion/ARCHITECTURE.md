Companion is the server side component for Uppy.  It is currently built with the Express.js.
The purpose of Companion is to interface with third party APIs and handle remote file uploading from them.

# How it works

## oAuth with Grant, Sessions
Companion uses an oAuth middleware library called `Grant` to simplify oAuth authentication.
Inside of `config/grant.js`, you configure the oAuth providers you wish to use, providing things like client key, 
client secret, scopes, and the callback URL you wish to use.  For example:

```
  google: {
    key: process.env.COMPANION_GOOGLE_KEY,
    secret: process.env.COMPANION_GOOGLE_SECRET,
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ],
    callback: '/google/callback'
  }
```

Once this `google` config is added to `config/grant.js`, Grant automatically creates a route `/connect/google` that 
redirects to Google's oAuth page.  So on the client side, you just need to link the user to `https://your-server/connect/google`.

After the user completes the oAuth flow, they should always be redirected to `https://your-server/:provider/callback`.
The `/:provider/callback` routes are handled by the `callback` controller at `server/controllers/callback.js`.  
This controller receives the oAuth token, generates a json web token with it, and sends the generated json web token to the client by adding it to the cookies. This way companion doesn't have to save users' oAuth tokens (which is good from the security perspective).
This json web token would be sent to companion in subsequent requests and the oAuth token can be read from it.

## Routing And Controllers
There are four generic routes:

```
router.get('/:provider/:action', dispatcher)
router.get('/:provider/:action/:id', dispatcher)
router.post('/:provider/:action', dispatcher)
router.post('/:provider/:action/:id', dispatcher)
```

Each route is handled by the `dispatcher` controller in `server/controllers/dispatcher.js`, which calls the correct controller based on `:action`.

There are 5 controllers:

| controller | description |
| ---------- | ----------- |
| `authorized` | checks if the current user is authorized |
| `callback` | handles redirect from oAuth.  Stores oAuth token in user session and redirects user. |
| `get` | downloads files from third party APIs, writes them to disk, and uploads them to the target server |
| `list` | fetches a list of files, usually from a specified directory |
| `logout` | removes all token info from the user session |

These controllers are generalized to work for any provider.  The provider specific implementation code for each provider can be found under `server/providers`.

## Adding new providers
To add a new provider to Companion, you need to do two things: add the provider config to `config/grant.js`, and then create a new file in `server/providers` that describes how to interface with the provider's API.

We are using a library called [purest](https://github.com/simov/purest) to make it easier to interface with third party APIs.  Instead of dealing with each and every single provider's client library/SDK, we use Purest, a "generic REST API client library" that gives us a consistent, "generic" API to interface with any provider.  This makes life a lot easier.

Since each API works differently, we need to describe how to `download` and `list` files from the provider in a file within `server/providers`.  The name of the file should be the same as what endpoint it will use.  For example, `server/providers/foobar.js` if the client requests a list of files from `https://our-server/foobar/list`.

**Note:** As of right now, you only need to implement `YourProvider.prototype.list` and `YourProvider.prototype.download` for each provider, I believe.  `stats` seems to be used by Dropbox to get a list of files, so that's required there, but `upload` is optional unless you all decide to allow uploading to third parties.  I got that code from an example.

This whole approach was inspired by an example from `purest 2.x`.  Keep in mind that we're using `3.x`, so the API is different, but here is the example for reference: https://github.com/simov/purest/tree/2.x/examples/storage

## WebSockets
Companion uses WebSockets to transfer `progress` events to the client during file transfers.  It's currently only set up to transfer progress during Tus uploads to the target server.  

When a request is made to `/:provider/get` to start a transfer, a token is generated and sent back to the client in response.  The client then connects to `wss://your-server/whatever-their-token-is`.  Any events that are emitted using the token as the name (i.e. `emitter.emit('whatever-their-token-is', progressData)`) are sent back to the client.

WebSockets aren't particularly secure, but we feel this is safe because the token is only usable during the corresponding file transfer, and no sensitive information is being sent, only a file id and the progress.

# Design Goals
These are the goals I had in mind while designing and building Companion.

## Standalone Server / Pluggable Module
Companion currently works as a standalone server.  It should also work as a module that can easily be incorporated into an already existing server, so people don't have to manage another server just to use Uppy.

One issue here is that `Grant` has different versions for Koa, Express, and Hapi.  We're using `grant-express` right now, and also use all express modules.  This becomes a problem if someone is using Koa, or Hapi, or something else.  I don't think we can make Companion completely framework agnostic, so best case scenario would be to follow Grant and make versions for Koa, Hapi, and Express.

All of this may be more trouble than it's worth if no one needs it, so I'd get some community feedback beforehand.

## Allow users to add new providers
Suppose a developer wants to use Uppy with a third party API provider that we don't support.  There needs to be some way for them to be able to add their own custom providers, hopefully without having to edit `companion`'s source (adding files to `server/providers`).
