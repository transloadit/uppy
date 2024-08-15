---
sidebar_position: 4
---

# Companion

Companion is an open source server application which **takes away the complexity
of authentication and the cost of downloading files from remote sources**, such
as Instagram, Google Drive, and others. Companion is a server-to-server
orchestrator that streams files from a source to a destination, and files are
never stored in Companion. Companion can run either as a standalone
(self-hosted) application, [Transloadit-hosted](#hosted), or plugged in as an
Express middleware into an existing application. The Uppy client requests remote
files from Companion, which it will download and simultaneously upload to your
[Tus server](/docs/tus), [AWS bucket](/docs/aws-s3), or any server that supports
[PUT, POST or Multipart uploads](/docs/xhr-upload).

This means a user uploading a 5GB video from Google Drive from their phone isn’t
eating into their data plans and you don’t have to worry about implementing
OAuth.

## When should I use it?

If you want to let users download files from [Box][], [Dropbox][], [Facebook][],
[Google Drive][googledrive], [Google Photos][googlephotos], [Instagram][],
[OneDrive][], [Unsplash][], [Import from URL][url], or [Zoom][] — you need
Companion.

Companion supports the same [uploaders](/docs/guides/choosing-uploader) as Uppy:
[Tus](/docs/tus), [AWS S3](/docs/aws-s3), and [regular multipart](/docs/tus).
But instead of manually setting a plugin, Uppy sends along a header with the
uploader and Companion will use the same on the server. This means if you are
using [Tus](/docs/tus) for your local uploads, you can send your remote uploads
to the same Tus server (and likewise for your AWS S3 bucket).

:::note

Companion only deals with _remote_ files, _local_ files are still uploaded from
the client with your upload plugin.

:::

## Hosted

Using [Transloadit][] services comes with a hosted version of Companion so you
don’t have to worry about hosting your own server. Whether you are on a free or
paid Transloadit [plan](https://transloadit.com/pricing/), you can use
Companion. It’s not possible to rent a Companion server without a Transloadit
plan.

[**Sign-up for a (free) plan**](https://transloadit.com/pricing/).

:::tip

Choosing Transloadit for your file services also comes with credentials for all
remote providers. This means you don’t have to waste time going through the
approval process of every app. You can still add your own credentials in the
Transloadit admin page if you want.

:::

:::info

Downloading and uploading files through Companion doesn’t count towards your
[monthly quota](https://transloadit.com/docs/faq/1gb-worth/), it’s a way for
files to arrive at Transloadit servers, much like Uppy.

:::

To do so each provider plugin must be configured with Transloadit’s Companion
URLs:

```js
import { COMPANION_URL, COMPANION_ALLOWED_HOSTS } from '@uppy/transloadit';
import Dropbox from '@uppy/dropbox';

uppy.use(Dropbox, {
	companionUrl: COMPANION_URL,
	companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
});
```

You may also hit rate limits, because the OAuth application is shared between
everyone using Transloadit.

To solve that, you can use your own OAuth keys with Transloadit’s hosted
Companion servers by using Transloadit Template Credentials. [Create a Template
Credential][template-credentials] on the Transloadit site. Select “Companion
OAuth” for the service, and enter the key and secret for the provider you want
to use. Then you can pass the name of the new credentials to that provider:

```js
import { COMPANION_URL, COMPANION_ALLOWED_HOSTS } from '@uppy/transloadit';
import Dropbox from '@uppy/dropbox';

uppy.use(Dropbox, {
	companionUrl: COMPANION_URL,
	companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
	companionKeysParams: {
		key: 'YOUR_TRANSLOADIT_API_KEY',
		credentialsName: 'my_companion_dropbox_creds',
	},
});
```

## Installation & use

Companion is installed from npm. Depending on how you want to run Companion, the
install process is slightly different. Companion can be integrated as middleware
into your [Express](https://expressjs.com/) app or as a standalone server. Most
people probably want to run it as a standalone server, while the middleware
could be used to further customise Companion or integrate it into your own HTTP
server code.

:::note

Since v2, you need to be running `node.js >= v10.20.1` to use Companion. More
information in the
[migrating to 2.0](/docs/guides/migration-guides/#migrate-from-uppy-1x-to-2x)
guide.

Windows is not a supported platform right now. It may work, and we’re happy to
accept improvements in this area, but we can’t provide support.

:::

### Standalone mode

You can use the standalone version if you want to run Companion as it’s own
Node.js process. It’s a configured Express server with sessions, logging, and
security best practices. First you’ll typically want to install it globally:

```bash
npm install -g @uppy/companion
```

Standalone Companion will always serve HTTP (not HTTPS) and expects a reverse
proxy with SSL termination in front of it when running in production. See
[`COMPANION_PROTOCOL`](#server) for more information.

Companion ships with an executable file (`bin/companion`) which is the
standalone server. Unlike the middleware version, options are set via
environment variables.

:::info

Checkout [options](#options) for the available options in JS and environment
variable formats.

:::

You need at least these three to get started:

```bash
export COMPANION_SECRET="shh!Issa Secret!"
export COMPANION_DOMAIN="YOUR SERVER DOMAIN"
export COMPANION_DATADIR="PATH/TO/DOWNLOAD/DIRECTORY"
```

Then run:

```bash
companion
```

You can also pass in the path to your JSON config file, like so:

```bash
companion --config /path/to/companion.json
```

You may also want to run Companion in a process manager like
[PM2](https://pm2.keymetrics.io/) to make sure it gets restarted on upon
crashing as well as allowing scaling to many instances.

### Express middleware mode

First install it into your Node.js project with your favorite package manager:

```bash
npm install @uppy/companion
```

To plug Companion into an existing server, call its `.app` method, passing in an
[options](#options) object as a parameter. This returns a server instance that
you can mount on a route in your Express app.

```js
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import companion from '@uppy/companion';

const app = express();

// Companion requires body-parser and express-session middleware.
// You can add it like this if you use those throughout your app.
//
// If you are using something else in your app, you can add these
// middlewares in the same subpath as Companion instead.
app.use(bodyParser.json());
app.use(session({ secret: 'some secrety secret' }));

const companionOptions = {
	providerOptions: {
		drive: {
			key: 'GOOGLE_DRIVE_KEY',
			secret: 'GOOGLE_DRIVE_SECRET',
		},
	},
	server: {
		host: 'localhost:3020',
		protocol: 'http',
		// Default installations normally don't need a path.
		// However if you specify a `path`, you MUST specify
		// the same path in `app.use()` below,
		// e.g. app.use('/companion', companionApp)
		// path: '/companion',
	},
	filePath: '/path/to/folder/',
};

const { app: companionApp } = companion.app(companionOptions);
app.use(companionApp);
```

Companion uses WebSockets to communicate progress, errors, and successes to the
client. This is what Uppy listens to to update it’s internal state and UI.

Add the Companion WebSocket server using the `companion.socket` function:

```js
const server = app.listen(PORT);

companion.socket(server);
```

If WebSockets fail for some reason Uppy and Companion will fallback to HTTP
polling.

### Running many instances

We recommend running at least two instances in production, so that if the
Node.js event loop gets blocked by one or more requests (due to a bug or spike
in traffic), it doesn’t also block or slow down all other requests as well (as
Node.js is single threaded).

As an example for scale, one enterprise customer of Transloadit, who self-hosts
Companion to power an education service that is used by many universities
globally, deploys 7 Companion instances. Their earlier solution ran on 35
instances. In our general experience Companion will saturate network interface
cards before other resources on commodity virtual servers (`c5d.2xlarge` for
instance).

Your mileage may vary, so we recommend to add observability. You can let
Prometheus crawl the `/metrics` endpoint and graph that with Grafana for
instance.

#### Using unique endpoints

One option is to run many instances with each instance having its own unique
endpoint. This could be on separate ports, (sub)domain names, or IPs. With this
setup, you can either:

1. Implement your own logic that will direct each upload to a specific Companion
   endpoint by setting the `companionUrl` option
2. Setting the Companion option `COMPANION_SELF_ENDPOINT`. This option will
   cause Companion to respond with a `i-am` HTTP header containing the value
   from `COMPANION_SELF_ENDPOINT`. When Uppy’s sees this header, it will pin all
   requests for the upload to this endpoint.

In either case, you would then also typically configure a single Companion
instance (one endpoint) to handle all OAuth authentication requests, so that you
only need to specify a single OAuth callback URL. See also `oauthDomain` and
`validHosts`.

#### Using a load balancer

The other option is to set up a load balancer in front of many Companion
instances. Then Uppy will only see a single endpoint and send all requests to
the associated load balancer, which will then distribute them between Companion
instances. The companion instances coordinate their messages and events over
Redis so that any instance can serve the client’s requests. Note that sticky
sessions are **not** needed with this setup. Here are the requirements for this
setup:

- The instances need to be connected to the same Redis server.
- You need to set `COMPANION_SECRET` to the same value on both servers.
- if you use the `companionKeysParams` feature (Transloadit), you also need
  `COMPANION_PREAUTH_SECRET` to be the same on each instance.
- All other configuration needs to be the same, except if you’re running many
  instances on the same machine, then `COMPANION_PORT` should be different for
  each instance.

## API

### Options

:::tip

The headings display the JS and environment variable options (`option`
`ENV_OPTION`). When integrating Companion into your own server, you pass the
options to `companion.app()`. If you are using the standalone version, you
configure Companion using environment variables. Some options only exist as
environment variables or only as a JS option.

:::

<details>
  <summary>Default configuration</summary>

```javascript
const options = {
	server: {
		protocol: 'http',
		path: '',
	},
	providerOptions: {},
	s3: {
		endpoint: 'https://{service}.{region}.amazonaws.com',
		conditions: [],
		useAccelerateEndpoint: false,
		getKey: ({ filename }) => `${crypto.randomUUID()}-${filename}`,
		expires: 800, // seconds
	},
	allowLocalUrls: false,
	logClientVersion: true,
	periodicPingUrls: [],
	streamingUpload: true,
	clientSocketConnectTimeout: 60000,
	metrics: true,
};
```

</details>

#### `filePath` `COMPANION_DATADIR`

Full path to the directory to which provider files will be downloaded
temporarily.

#### `secret` `COMPANION_SECRET` `COMPANION_SECRET_FILE`

A secret string which Companion uses to generate authorization tokens. You
should generate a long random string for this. For example:

```js
const crypto = require('node:crypto');

const secret = crypto.randomBytes(64).toString('hex');
```

:::caution

Omitting the `secret` in the standalone version will generate a secret for you,
using the above `crypto` string. But when integrating with Express you must
provide it yourself. This is an essential security measure.

:::

:::note

Using a secret file means passing an absolute path to a file with any extension,
which has only the secret, nothing else.

:::

#### `preAuthSecret` `COMPANION_PREAUTH_SECRET` `COMPANION_PREAUTH_SECRET_FILE`

If you are using the [Transloadit](/docs/transloadit) `companionKeysParams`
feature (Transloadit-hosted Companion using your own custom OAuth credentials),
set this variable to a strong randomly generated secret. See also
`COMPANION_SECRET` (but do not use the same secret!)

:::note

Using a secret file means passing an absolute path to a file with any extension,
which has only the secret, nothing else.

:::

#### `uploadUrls` `COMPANION_UPLOAD_URLS`

An allowlist (array) of strings (exact URLs) or regular expressions. Companion
will only accept uploads to these URLs. This ensures that your Companion
instance is only allowed to upload to your trusted servers and prevents
[SSRF](https://en.wikipedia.org/wiki/Server-side_request_forgery) attacks.

#### `COMPANION_PORT`

The port on which to start the standalone server, defaults to 3020. This is a
standalone-only option.

#### `COMPANION_COOKIE_DOMAIN`

Allows you to customize the domain of the cookies created for Express sessions.
This is a standalone-only option.

#### `COMPANION_HIDE_WELCOME`

Setting this to `true` disables the welcome message shown at `/`. This is a
standalone-only option.

#### `redisUrl` `COMPANION_REDIS_URL`

URL to running Redis server. This can be used to scale Companion horizontally
using many instances. See [How to scale Companion](#how-to-scale-companion).

#### `COMPANION_REDIS_EXPRESS_SESSION_PREFIX`

Set a custom prefix for redis keys created by
[connect-redis](https://github.com/tj/connect-redis). Defaults to
`companion-session:`. Sessions are used for storing authentication state and for
allowing thumbnails to be loaded by the browser via Companion and for OAuth2.
See also `COMPANION_REDIS_PUBSUB_SCOPE`.

#### `redisOptions` `COMPANION_REDIS_OPTIONS`

An object of
[options supported by the `ioredis` client](https://github.com/redis/ioredis).
See also
[`RedisOptions`](https://github.com/redis/ioredis/blob/af832752040e616daf51621681bcb40cab965a9b/lib/redis/RedisOptions.ts#L8).

#### `redisPubSubScope` `COMPANION_REDIS_PUBSUB_SCOPE`

Use a scope for the companion events at the Redis server. Setting this option
will prefix all events with the name provided and a colon. See also
`COMPANION_REDIS_EXPRESS_SESSION_PREFIX`.

#### `server`

Configuration options for the underlying server.

| Key / Environment variable               | Value             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `protocol` `COMPANION_PROTOCOL`          | `http` or `https` | Used to build a URL to reference the Companion instance itself, which is used for headers and cookies. Companion itself always runs as a HTTP server, so locally you should use `http`. You must to set this to `https` once you enabled SSL/HTTPS for your domain in production by running a reverse https-proxy in front of Companion, or with a built-in HTTPS feature of your hosting service.                                           |
| `host` `COMPANION_DOMAIN`                | `String`          | Your server’s publicly facing hostname (for example `example.com`).                                                                                                                                                                                                                                                                                                                                                                          |
| `oauthDomain` `COMPANION_OAUTH_DOMAIN`   | `String`          | If you have several instances of Companion with different (and perhaps dynamic) subdomains, you can set a single fixed subdomain and server (such as `sub1.example.com`) to handle your OAuth authentication for you. This would then redirect back to the correct instance with the required credentials on completion. This way you only need to configure a single callback URL for OAuth providers.                                      |
| `path` `COMPANION_PATH`                  | `String`          | The server path to where the Companion app is sitting. For instance, if Companion is at `example.com/companion`, then the path would be `/companion`).                                                                                                                                                                                                                                                                                       |
| `implicitPath` `COMPANION_IMPLICIT_PATH` | `String`          | If the URL’s path in your reverse proxy is different from your Companion path in your express app, then you need to set this path as `implicitPath`. For instance, if your Companion URL is `example.com/mypath/companion`. Where the path `/mypath` is defined in your NGINX server, while `/companion` is set in your express app. Then you need to set the option `implicitPath` to `/mypath`, and set the `path` option to `/companion`. |
| `validHosts` `COMPANION_DOMAINS`         | `Array`           | If you are setting an `oauthDomain`, you need to set a list of valid hosts, so the oauth handler can validate the host of the Uppy instance requesting the authentication. This is essentially a list of valid domains running your Companion instances. The list may also contain regex patterns. e.g `['sub2.example.com', 'sub3.example.com', '(\\w+).example.com']`                                                                      |

#### `sendSelfEndpoint` `COMPANION_SELF_ENDPOINT`

This is essentially the same as the `server.host + server.path` attributes. The
major reason for this attribute is that, when set, it adds the value as the
`i-am` header of every request response.

#### `providerOptions`

Object to enable providers with their keys and secrets. For example:

```json
{
	"drive": {
		"key": "***",
		"secret": "***"
	}
}
```

When using the standalone version you use the corresponding environment
variables or point to a secret file (such as `COMPANION_GOOGLE_SECRET_FILE`).

:::note

Secret files need an absolute path to a file with any extension which only has
the secret, nothing else.

:::

| Service       | Key            | Environment variables                                                                                                                                                                                                                  |
| ------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Box           | `box`          | `COMPANION_BOX_KEY`, `COMPANION_BOX_SECRET`, `COMPANION_BOX_SECRET_FILE`                                                                                                                                                               |
| Dropbox       | `dropbox`      | `COMPANION_DROPBOX_KEY`, `COMPANION_DROPBOX_SECRET`, `COMPANION_DROPBOX_SECRET_FILE`                                                                                                                                                   |
| Facebook      | `facebook`     | `COMPANION_FACEBOOK_KEY`, `COMPANION_FACEBOOK_SECRET`, `COMPANION_FACEBOOK_SECRET_FILE`                                                                                                                                                |
| Google Drive  | `drive`        | `COMPANION_GOOGLE_KEY`, `COMPANION_GOOGLE_SECRET`, `COMPANION_GOOGLE_SECRET_FILE`                                                                                                                                                      |
| Google Photos | `googlephotos` | `COMPANION_GOOGLE_KEY`, `COMPANION_GOOGLE_SECRET`, `COMPANION_GOOGLE_SECRET_FILE`                                                                                                                                                      |
| Instagram     | `instagram`    | `COMPANION_INSTAGRAM_KEY`, `COMPANION_INSTAGRAM_SECRET`, `COMPANION_INSTAGRAM_SECRET_FILE`                                                                                                                                             |
| OneDrive      | `onedrive`     | `COMPANION_ONEDRIVE_KEY`, `COMPANION_ONEDRIVE_SECRET`, `COMPANION_ONEDRIVE_SECRET_FILE`, `COMPANION_ONEDRIVE_DOMAIN_VALIDATION` (Settings this variable to `true` enables a route that can be used to validate your app with OneDrive) |
| Zoom          | `zoom`         | `COMPANION_ZOOM_KEY`, `COMPANION_ZOOM_SECRET`, `COMPANION_ZOOM_SECRET_FILE`, `COMPANION_ZOOM_VERIFICATION_TOKEN`                                                                                                                       |

#### `s3`

Companion comes with signature endpoints for AWS S3. These can be used by the
Uppy client to sign requests to upload files directly to S3, without exposing
secret S3 keys in the browser. Companion also supports uploading files from
providers like Dropbox and Instagram directly into S3.

##### `s3.key` `COMPANION_AWS_KEY`

The S3 access key ID.

##### `s3.secret` `COMPANION_AWS_SECRET` `COMPANION_AWS_SECRET_FILE`

The S3 secret access key.

:::note

Using a secret file means passing an absolute path to a file with any extension,
which has only the secret, nothing else.

:::

##### `s3.endpoint` `COMPANION_AWS_ENDPOINT`

Optional URL to a custom S3 (compatible) service. Otherwise uses the default
from the AWS SDK.

##### `s3.bucket` `COMPANION_AWS_BUCKET`

The name of the bucket to store uploaded files in.

A `string` or function that returns the name of the bucket as a `string` and
takes one argument which is an object with the following properties:

- `filename`, the original name of the uploaded file;
- `metadata` provided by the user for the file (will only be provided during the
  initial calls for each uploaded files, otherwise it will be `undefined`).
- `req`, Express.js `Request` object. Do not use any Companion internals from
  the req object, as these might change in any minor version of Companion.

#### `s3.forcePathStyle` `COMPANION_AWS_FORCE_PATH_STYLE`

This adds support for setting the S3 client’s `forcePathStyle` option. That is
necessary to use Uppy/Companion alongside localstack in development
environments. **Default**: `false`.

##### `s3.region` `COMPANION_AWS_REGION`

The datacenter region where the target bucket is located.

##### `COMPANION_AWS_PREFIX`

An optional prefix for all uploaded keys. This is a standalone-only option. The
same can be achieved by the `getKey` option when using the express middleware.

##### `s3.awsClientOptions`

You can supply any
[S3 option supported by the AWS SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property)
in the `providerOptions.s3.awsClientOptions` object, _except for_ the below:

- `accessKeyId`. Instead, use the `providerOptions.s3.key` property. This is to
  make configuration names consistent between different Companion features.
- `secretAccessKey`. Instead, use the `providerOptions.s3.secret` property. This
  is to make configuration names consistent between different Companion
  features.

Be aware that some options may cause wrong behaviour if they conflict with
Companion’s assumptions. If you find that a particular option does not work as
expected, please
[open an issue on the Uppy repository](https://github.com/transloadit/uppy/issues/new)
so we can document it here.

##### `s3.getKey({ filename, metadata, req })`

Get the key name for a file. The key is the file path to which the file will be
uploaded in your bucket. This option should be a function receiving three
arguments:

- `filename`, the original name of the uploaded file;
- `metadata`, user-provided metadata for the file.
- `req`, Express.js `Request` object. Do not use any Companion internals from
  the req object, as these might change in any minor version of Companion.

This function should return a string `key`. The `req` parameter can be used to
upload to a user-specific folder in your bucket, for example:

```js
app.use(authenticationMiddleware);
app.use(
	uppy.app({
		providerOptions: {
			s3: {
				getKey: ({ req, filename, metadata }) => `${req.user.id}/${filename}`,
				/* auth options */
			},
		},
	}),
);
```

The default implementation returns the `filename`, so all files will be uploaded
to the root of the bucket as their original file name.

```js
app.use(
	uppy.app({
		providerOptions: {
			s3: {
				getKey: ({ filename, metadata }) => filename,
			},
		},
	}),
);
```

When signing on the client, this function will only be called for multipart
uploads.

#### `COMPANION_AWS_USE_ACCELERATE_ENDPOINT`

Enable S3
[Transfer Acceleration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html).
This is a standalone-only option.

#### `COMPANION_AWS_EXPIRES`

Set `X-Amz-Expires` query parameter in the presigned urls (in seconds, default:
300\). This is a standalone-only option.

#### `COMPANION_AWS_ACL`

Set a
[Canned ACL](https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl)
for uploaded objects. This is a standalone-only option.

#### `customProviders`

This option enables you to add custom providers along with the already supported
providers. See [adding custom providers](#how-to-add-custom-providers) for more
information.

#### `logClientVersion`

A boolean flag to tell Companion whether to log its version upon startup.

#### `metrics` `COMPANION_HIDE_METRICS`

A boolean flag to tell Companion whether to provide an endpoint `/metrics` with
Prometheus metrics (by default metrics are enabled.)

#### `streamingUpload` `COMPANION_STREAMING_UPLOAD`

A boolean flag to tell Companion whether to enable streaming uploads. If
enabled, it will lead to _faster uploads_ because companion will start uploading
at the same time as downloading using `stream.pipe`. If `false`, files will be
fully downloaded first, then uploaded. Defaults to `true`.

#### `maxFileSize` `COMPANION_MAX_FILE_SIZE`

If this value is set, companion will limit the maximum file size to process. If
unset, it will process files without any size limit (this is the default).

#### `periodicPingUrls` `COMPANION_PERIODIC_PING_URLS`

If this value is set, companion will periodically send POST requests to the
specified URLs. Useful for keeping track of companion instances as a keep-alive.

#### `periodicPingInterval` `COMPANION_PERIODIC_PING_INTERVAL`

Interval for periodic ping requests (in ms).

#### `periodicPingStaticPayload` `COMPANION_PERIODIC_PING_STATIC_JSON_PAYLOAD`

A `JSON.stringify`-able JavaScript Object that will be sent as part of the JSON
body in the period ping requests.

#### `allowLocalUrls` `COMPANION_ALLOW_LOCAL_URLS`

A boolean flag to tell Companion whether to allow requesting local URLs
(non-internet IPs).

:::caution

Only enable this in development. **Enabling it in production is a security
risk.**

:::

#### `corsOrigins` (required)

Allowed CORS Origins. Passed as the `origin` option in
[cors](https://github.com/expressjs/cors#configuration-options).

Note this is used for both CORS’ `Access-Control-Allow-Origin` header, and for
the
[`targetOrigin`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#targetorigin)
for `postMessage` calls in the context of OAuth.

Setting it to `true` treats any origin as a trusted one, making it easier to
impersonate your brand. Setting it to `false` disables cross-origin support, use
this if you’re serving Companion and Uppy from the same domain name.

##### `COMPANION_CLIENT_ORIGINS`

Stand-alone alternative to the `corsOrigins` option. A comma-separated string of
origins, or `'true'` (which will be interpreted as the boolean value `true`), or
`'false'` (which will be interpreted as the boolean value `false`).
`COMPANION_CLIENT_ORIGINS_REGEX` will be ignored if this option is used.

##### `COMPANION_CLIENT_ORIGINS_REGEX`

:::note

In most cases, you should not be using a regex, and instead provide the list of
accepted origins to `COMPANION_CLIENT_ORIGINS`. If you have to use this option,
have in mind that this regex will be used to parse unfiltered user input, so
make sure you’re validating the entirety of the string.

:::

Stand-alone alternative to the `corsOrigins` option. Like
`COMPANION_CLIENT_ORIGINS`, but allows a single regex instead.

#### `chunkSize` `COMPANION_CHUNK_SIZE`

Controls how big the uploaded chunks are for AWS S3 Multipart and Tus. Smaller
values lead to more overhead, but larger values lead to slower retries in case
of bad network connections. Passed to tus-js-client
[`chunkSize`](https://github.com/tus/tus-js-client/blob/master/docs/api.md#chunksize)
as well as
[AWS S3 Multipart](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)
`partSize`.

#### `enableUrlEndpoint` `COMPANION_ENABLE_URL_ENDPOINT`

Set this to `true` to enable the [URL functionalily](https://uppy.io/docs/url/).
Default: `false`.

### Events

The object returned by `companion.app()` also has a property `companionEmitter`
which is an `EventEmitter` that emits the following events:

- `upload-start` - When an upload starts, this event is emitted with an object
  containing the property `token`, which is a unique ID for the upload.
- **token** - The event name is the token from `upload-start`. The event has an
  object with the following properties:
  - `action` - One of the following strings:
    - `success` - When the upload succeeds.
    - `error` - When the upload fails with an error.
  - `payload` - the error or success payload.

Example code for using the `EventEmitter` to handle a finished file upload:

```js
const companionApp = companion.app(options);
const { companionEmitter: emitter } = companionApp;

emitter.on('upload-start', ({ token }) => {
	console.log('Upload started', token);

	function onUploadEvent({ action, payload }) {
		if (action === 'success') {
			emitter.off(token, onUploadEvent); // avoid listener leak
			console.log('Upload finished', token, payload.url);
		} else if (action === 'error') {
			emitter.off(token, onUploadEvent); // avoid listener leak
			console.error('Upload failed', payload);
		}
	}
	emitter.on(token, onUploadEvent);
});
```

<!--retext-simplify ignore frequently-->

## Frequently asked questions

### Do you have a live example?

An example server is running at <https://companion.uppy.io>.

### How does the Authentication and Token mechanism work?

This section describes how Authentication works between Companion and Providers.
While this behaviour is the same for all Providers (Dropbox, Instagram, Google
Drive, etc.), we are going to be referring to Dropbox in place of any Provider
throughout this section.

The following steps describe the actions that take place when a user
Authenticates and Uploads from Dropbox through Companion:

- The visitor to a website with Uppy clicks `Connect to Dropbox`.
- Uppy sends a request to Companion, which in turn sends an OAuth request to
  Dropbox (Requires that OAuth credentials from Dropbox have been added to
  Companion).
- Dropbox asks the visitor to log in, and whether the Website should be allowed
  to access your files
- If the visitor agrees, Companion will receive a token from Dropbox, with which
  we can temporarily download files.
- Companion encrypts the token with a secret key and sends the encrypted token
  to Uppy (client)
- Every time the visitor clicks on a folder in Uppy, it asks Companion for the
  new list of files, with this question, the token (still encrypted by
  Companion) is sent along.
- Companion decrypts the token, requests the list of files from Dropbox and
  sends it to Uppy.
- When a file is selected for upload, Companion receives the token again
  according to this procedure, decrypts it again, and thereby downloads the file
  from Dropbox.
- As the bytes arrive, Companion uploads the bytes to the final destination
  (depending on the configuration: Apache, a Tus server, S3 bucket, etc).
- Companion reports progress to Uppy, as if it were a local upload.
- Completed!

### How to use provider redirect URIs?

When generating your provider API keys on their corresponding developer
platforms (e.g
[Google Developer Console](https://console.developers.google.com/)), you’d need
to provide a `redirect URI` for the OAuth authorization process. In general the
redirect URI for each provider takes the format:

`http(s)://$YOUR_COMPANION_HOST_NAME/$PROVIDER_NAME/redirect`

For example, if your Companion server is hosted on
`https://my.companion.server.com`, then the redirect URI you would supply for
your OneDrive provider would be:

`https://my.companion.server.com/onedrive/redirect`

Please see
[Supported Providers](https://uppy.io/docs/companion/#Supported-providers) for a
list of all Providers and their corresponding names.

### How to use Companion with Kubernetes?

We have a detailed
[guide](https://github.com/transloadit/uppy/blob/main/packages/%40uppy/companion/KUBERNETES.md)
on running Companion in Kubernetes.

### How to add custom providers?

As of now, Companion supports the
[providers listed here](https://uppy.io/docs/companion/#Supported-providers) out
of the box, but you may also choose to add your own custom providers. You can do
this by passing the `customProviders` option when calling the Uppy `app` method.
The custom provider is expected to support Oauth 1 or 2 for
authentication/authorization.

```javascript
import providerModule from './path/to/provider/module';

const options = {
	customProviders: {
		myprovidername: {
			config: {
				authorize_url: 'https://mywebsite.com/authorize',
				access_url: 'https://mywebsite.com/token',
				oauth: 2,
				key: '***',
				secret: '***',
				scope: ['read', 'write'],
			},
			module: providerModule,
		},
	},
};

uppy.app(options);
```

The `customProviders` option should be an object containing each custom
provider. Each custom provider would, in turn, be an object with two keys,
`config` and `module`. The `config` option would contain Oauth API settings,
while the `module` would point to the provider module.

To work well with Companion, the **module** must be a class with the following
methods. Note that the methods must be `async`, return a `Promise` or reject
with an `Error`):

1. `async list ({ token, directory, query })` - Returns a object containing a
   list of user files (such as a list of all the files in a particular
   directory). See [example returned list data structure](#list-data). `token` -
   authorization token (retrieved from oauth process) to send along with your
   request
   - `directory` - the id/name of the directory from which data is to be
     retrieved. This may be ignored if it doesn’t apply to your provider
   - `query` - expressjs query params object received by the server (in case
     some data you need in there).
2. `async download ({ token, id, query })` - Downloads a particular file from
   the provider. Returns an object with a single property `{ stream }` - a
   [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_readable),
   which will be read from and uploaded to the destination. To prevent memory
   leaks, make sure you release your stream if you reject this method with an
   error.
   - `token` - authorization token (retrieved from oauth process) to send along
     with your request.
   - `id` - ID of the file being downloaded.
   - `query` - expressjs query params object received by the server (in case
     some data you need in there).
3. `async size ({ token, id, query })` - Returns the byte size of the file that
   needs to be downloaded as a `Number`. If the size of the object is not known,
   `null` may be returned.
   - `token` - authorization token (retrieved from oauth process) to send along
     with your request.
   - `id` - ID of the file being downloaded.
   - `query` - expressjs query params object received by the server (in case
     some data you need in there).

The class must also have:

- A unique `static authProvider` string property - a lowercased value which
  indicates name of the [`grant`](https://github.com/simov/grant) OAuth2
  provider to use (e.g `google` for Google). If your provider doesn’t use
  OAuth2, you can omit this property.
- A `static` property `static version = 2`, which is the current version of the
  Companion Provider API.

See also
[example code with a custom provider](https://github.com/transloadit/uppy/blob/main/examples/custom-provider/server).

#### list data

```json
{
	// username or email of the user whose provider account is being accessed
	"username": "johndoe",
	// list of files and folders in the directory. An item is considered a folder
	//  if it mainly exists as a collection to contain sub-items
	"items": [
		{
			// boolean value of whether or NOT it's a folder
			"isFolder": false,
			// icon image URL
			"icon": "https://random-api.url.com/fileicon.jpg",
			// name of the item
			"name": "myfile.jpg",
			// the mime type of the item. Only relevant if the item is NOT a folder
			"mimeType": "image/jpg",
			// the id (in string) of the item
			"id": "uniqueitemid",
			// thumbnail image URL. Only relevant if the item is NOT a folder
			"thumbnail": "https://random-api.url.com/filethumbnail.jpg",
			// for folders this is typically the value that will be passed as "directory" in the list(...) method.
			// For files, this is the value that will be passed as id in the download(...) method.
			"requestPath": "file-or-folder-requestpath",
			// datetime string (in ISO 8601 format) of when this item was last modified
			"modifiedDate": "2020-06-29T19:59:58Z",
			// the size in bytes of the item. Only relevant if the item is NOT a folder
			"size": 278940,
			"custom": {
				// an object that may contain some more custom fields that you may need to send to the client. Only add this object if you have a need for it.
				"customData1": "the value",
				"customData2": "the value"
			}
			// more items here
		}
	],
	// if the "items" list is paginated, this is the request path needed to fetch the next page.
	"nextPagePath": "directory-name?cursor=cursor-to-next-page"
}
```

### How to run Companion locally?

1. To set up Companion for local development, please clone the Uppy repo and
   install, like so:

   ```bash
   git clone https://github.com/transloadit/uppy
   cd uppy
   yarn install
   ```

2. Configure your environment variables by copying the `env.example.sh` file to
   `env.sh` and edit it to its correct values.

   ```bash
   cp .env.example .env
   $EDITOR .env
   ```

3. To start the server, run:

   ```bash
   yarn run start:companion
   ```

This would get the Companion instance running on `http://localhost:3020`. It
uses [`node --watch`](https://nodejs.org/api/cli.html#--watch) so it will
automatically restart when files are changed.

[box]: /docs/box
[dropbox]: /docs/dropbox
[facebook]: /docs/facebook
[googledrive]: /docs/google-drive
[googlephotos]: /docs/google-photos
[instagram]: /docs/instagram
[onedrive]: /docs/onedrive
[unsplash]: /docs/unsplash
[url]: /docs/url
[zoom]: /docs/zoom
[transloadit]: https://transloadit.com
[template-credentials]:
	https://transloadit.com/docs/#how-to-create-template-credentials
