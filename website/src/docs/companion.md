---
type: docs
order: 2
title: "Companion"
module: "@uppy/companion"
permalink: docs/companion/
alias: docs/server/
category: "Docs"
tagline: "Server-side proxy that enables remote sources like Instagram, Google Drive, and Dropbox"
---

Drag and drop, webcam, basic file manipulation (adding metadata, for example) and uploading via tus-resumable uploads or XHR/Multipart are all possible using only the Uppy client module.

<!--retext-simplify ignore however-->

However, if you add [Companion](https://github.com/transloadit/uppy/tree/main/packages/@uppy/companion) to the mix, your users will be able to select files from remote sources, such as Instagram, Google Drive and Dropbox, bypassing the client (so a 5 GB video isn’t eating into your users’ data plans), and then uploaded to the final destination. Files are removed from Companion after an upload is complete, or after a reasonable timeout. Access tokens also don’t stick around for long, for security reasons.

Companion handles the server-to-server communication between your server and file storage providers such as Google Drive, Dropbox, Instagram, etc. Note that you can **not** upload files **to** Companion, it only handles the third party integrations.

## Supported providers

As of now, Companion is integrated to work with:

* Google Drive (name `drive`) - [Set up instructions](/docs/google-drive/#Setting-Up)
* Dropbox (name `dropbox`) - [Set up instructions](/docs/dropbox/#Setting-Up)
* Box (name `box`) - [Set up instructions](/docs/box/#Setting-Up)
* Instagram (name `instagram`)
* Facebook (name `facebook`)
* OneDrive (name `onedrive`)
* Remote URLs (name `url`)
* Amazon S3 (name `s3`)

## Installation

Install from NPM:

```bash
npm install @uppy/companion
```

If you don’t have a Node.js project with a `package.json` you might want to install/run Companion globally like so: `npm install -g @uppy/companion`.

### Prerequisite

Since v2, you now need to be running `node.js >= v10.20.1` to use Companion. Please see [Migrating v1 to v2](#Migrating-v1-to-v2)

Unfortunately, Windows is not a supported platform right now. It may work, and we’re happy to accept improvements in this area, but we can’t provide support.

## Usage

<!--retext-simplify ignore already-existing-->

Companion may either be used as a pluggable express app, which you plug into your already existing server, or it may also be run as a standalone server:

### Plugging into an existing express server

To plug Companion into an existing server, call its `.app` method, passing in an [options](#Options) object as a parameter. This returns a server instance that you can mount on a subpath in your Express or app.

```js
import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import companion from '@uppy/companion'

const app = express()

// Companion requires body-parser and express-session middleware.
// You can add it like this if you use those throughout your app.
//
// If you are using something else in your app, you can add these
// middlewares in the same subpath as Companion instead.
app.use(bodyParser.json())
app.use(session({ secret: 'some secrety secret' }))

const options = {
  providerOptions: {
    drive: {
      key: 'GOOGLE_DRIVE_KEY',
      secret: 'GOOGLE_DRIVE_SECRET',
    },
  },
  server: {
    host: 'localhost:3020',
    protocol: 'http',
    // This MUST match the path you specify in `app.use()` below:
    path: '/companion',
  },
  filePath: '/path/to/folder/',
}

app.use('/companion', companion.app(options))
```

See [Options](#Options) for valid configuration options.

Then, add the Companion WebSocket server for realtime upload progress, using the `companion.socket` function:

```js
const server = app.listen(PORT)

companion.socket(server)
```

This takes your `server` instance as an argument.

### Running as a standalone server

> Please make sure that the required environment variables are set before running/using Companion as a standalone server. See [Configure Standalone](#Configuring-a-standalone-server) for the variables required.

Set environment variables first:

```bash
export COMPANION_SECRET="shh!Issa Secret!"
export COMPANION_DOMAIN="YOUR SERVER DOMAIN"
export COMPANION_DATADIR="PATH/TO/DOWNLOAD/DIRECTORY"
```

And then run:

```bash
companion
```

You can also pass in the path to your JSON config file, like so:

```bash
companion --config /path/to/uppyconf.json
```

Please see [Options](#Options) for possible options.

#### Configuring a standalone server

To run Companion as a standalone server, you are required to set your Uppy [Options](#Options) via environment variables:

```bash
####### Mandatory variables ###########

# any long set of random characters for the server session
export COMPANION_SECRET="shh!Issa Secret!"
# specifying a secret file will override a directly set secret
export COMPANION_SECRET_FILE="PATH/TO/COMPANION/SECRET/FILE"
# corresponds to the server.host option
export COMPANION_DOMAIN="YOUR SERVER DOMAIN"
# corresponds to the filePath option
export COMPANION_DATADIR="PATH/TO/DOWNLOAD/DIRECTORY"

###### Optional variables ##########

# corresponds to the server.protocol option, defaults to http
export COMPANION_PROTOCOL="YOUR SERVER PROTOCOL"
# the port on which to start the server, defaults to 3020
export COMPANION_PORT="YOUR SERVER PORT"
# corresponds to the server.port option, defaults to ''
export COMPANION_PATH="/SERVER/PATH/TO/WHERE/COMPANION/LIVES"
# disables the welcome page, defaults to false
export COMPANION_HIDE_WELCOME="true"
# disables the metrics page, defaults to false
export COMPANION_HIDE_METRICS="true"

# use this in place of COMPANION_PATH if the server path should not be
# handled by the express.js app, but maybe by an external server configuration
# instead (e.g Nginx).
export COMPANION_IMPLICIT_PATH="/SERVER/PATH/TO/WHERE/UPPY/SERVER/LIVES"

# comma-separated client hosts to whitlelist by the server
# if neither this or COMPANION_CLIENT_ORIGINS_REGEX specified, the server would allow any host
export COMPANION_CLIENT_ORIGINS="localhost:3452,uppy.io"

# Like COMPANION_CLIENT_ORIGINS, but allows a single regex instead
# (COMPANION_CLIENT_ORIGINS will be ignored if this is used and vice versa)
export COMPANION_CLIENT_ORIGINS_REGEX="https://.*\.example\.(com|eu)$"

# corresponds to the redisUrl option
# this also enables Redis session storage if set
export COMPANION_REDIS_URL="REDIS URL"

# to enable Dropbox
export COMPANION_DROPBOX_KEY="YOUR DROPBOX KEY"
export COMPANION_DROPBOX_SECRET="YOUR DROPBOX SECRET"
# specifying a secret file will override a directly set secret
export COMPANION_DROPBOX_SECRET_FILE="PATH/TO/DROPBOX/SECRET/FILE"

# to enable Box
export COMPANION_BOX_KEY="YOUR BOX KEY"
export COMPANION_BOX_SECRET="YOUR BOX SECRET"
# specifying a secret file will override a directly set secret
export COMPANION_BOX_SECRET_FILE="PATH/TO/BOX/SECRET/FILE"

# to enable Google Drive
export COMPANION_GOOGLE_KEY="YOUR GOOGLE DRIVE KEY"
export COMPANION_GOOGLE_SECRET="YOUR GOOGLE DRIVE SECRET"
# specifying a secret file will override a directly set secret
export COMPANION_GOOGLE_SECRET_FILE="PATH/TO/GOOGLEDRIVE/SECRET/FILE"

# to enable Instagram
export COMPANION_INSTAGRAM_KEY="YOUR INSTAGRAM KEY"
export COMPANION_INSTAGRAM_SECRET="YOUR INSTAGRAM SECRET"
# specifying a secret file will override a directly set secret
export COMPANION_INSTAGRAM_SECRET_FILE="PATH/TO/INSTAGRAM/SECRET/FILE"

# to enable Facebook
export COMPANION_FACEBOOK_KEY="YOUR FACEBOOK KEY"
export COMPANION_FACEBOOK_SECRET="YOUR FACEBOOK SECRET"
# specifying a secret file will override a directly set secret
export COMPANION_FACEBOOK_SECRET_FILE="PATH/TO/FACEBOOK/SECRET/FILE"

# to enable Onedrive
export COMPANION_ONEDRIVE_KEY="YOUR ONEDRIVE KEY"
export COMPANION_ONEDRIVE_SECRET="YOUR ONEDRIVE SECRET"
# specifying a secret file will override a directly set secret
export COMPANION_ONEDRIVE_SECRET_FILE="PATH/TO/ONEDRIVE/SECRET/FILE"

# to enable Zoom
export COMPANION_ZOOM_KEY="YOUR ZOOM KEY"
export COMPANION_ZOOM_SECRET="YOUR ZOOM SECRET"
# specifying a secret file will override a directly set secret
export COMPANION_ZOOM_SECRET_FILE="PATH/TO/ZOOM/SECRET/FILE"

# to enable S3
export COMPANION_AWS_KEY="YOUR AWS KEY"
export COMPANION_AWS_SECRET="YOUR AWS SECRET"
# specifying a secret file will override a directly set secret
export COMPANION_AWS_SECRET_FILE="PATH/TO/AWS/SECRET/FILE"
export COMPANION_AWS_BUCKET="YOUR AWS S3 BUCKET"
export COMPANION_AWS_REGION="AWS REGION"
# to enable S3 Transfer Acceleration (default: false)
export COMPANION_AWS_USE_ACCELERATE_ENDPOINT="false"
# to set X-Amz-Expires query param in presigned urls (in seconds, default: 300)
export COMPANION_AWS_EXPIRES="300"
# to set a canned ACL for uploaded objects: https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl
export COMPANION_AWS_ACL="public-read"

# corresponds to the server.oauthDomain option
export COMPANION_OAUTH_DOMAIN="sub.domain.com"
# corresponds to the server.validHosts option
export COMPANION_DOMAINS="sub1.domain.com,sub2.domain.com,sub3.domain.com"

# corresponds to the sendSelfEndpoint option
export COMPANION_SELF_ENDPOINT="THIS SHOULD BE SAME AS YOUR DOMAIN + PATH"

# comma-separated URLs
# corresponds to the uploadUrls option (comma-separated)
export COMPANION_UPLOAD_URLS="http://tusd.tusdemo.net/files/,https://tusd.tusdemo.net/files/"

# corresponds to the streamingUpload option
export COMPANION_STREAMING_UPLOAD=true

# corresponds to the allowLocalUrls option
export COMPANION_ALLOW_LOCAL_URLS=false

# corresponds to the maxFileSize option
export COMPANION_MAX_FILE_SIZE="100000000"

# corresponds to the chunkSize option
export COMPANION_CHUNK_SIZE="50000000"

# corresponds to the periodicPingUrls option (CSV string converted to array)
export COMPANION_PERIODIC_PING_URLS="https://example.com/ping1,https://example.com/ping2"
# corresponds to the periodicPingInterval option
export COMPANION_PERIODIC_PING_INTERVAL=60000
# corresponds to the periodicPingStaticPayload option (JSON string)
export COMPANION_PERIODIC_PING_STATIC_JSON_PAYLOAD="{\"static\":\"data\"}"
```

See [env.example.sh](https://github.com/transloadit/uppy/blob/main/env.example.sh) for an example configuration script.

### Options

```javascript
const options = {
  providerOptions: {
    drive: {
      key: '***',
      secret: '***',
    },
    dropbox: {
      key: '***',
      secret: '***',
    },
    instagram: {
      key: '***',
      secret: '***',
    },
    facebook: {
      key: '***',
      secret: '***',
    },
    onedrive: {
      key: '***',
      secret: '***',
    },
    s3: {
      getKey: (req, filename, metadata) => filename,
      key: '***',
      secret: '***',
      bucket: 'bucket-name',
      region: 'us-east-1',
      useAccelerateEndpoint: false, // default: false,
      expires: 3600, // default: 300 (5 minutes)
      acl: 'private', // default: public-read
    },
  },
  server: {
    host: 'localhost:3020', // or yourdomain.com
    protocol: 'http',
  },
  filePath: 'path/to/download/folder',
  sendSelfEndpoint: 'localhost:3020',
  secret: 'mysecret',
  uploadUrls: ['https://myuploadurl.com', /^http:\/\/myuploadurl2.com\//],
  debug: true,
  metrics: false,
  streamingUpload: true,
  allowLocalUrls: false,
  maxFileSize: 100000000,
  periodicPingUrls: [],
  periodicPingInterval: 60000,
  periodicPingStaticPayload: { static: 'payload' },
}
```

1. **filePath(required)** - Full path to the directory to which provider files will be downloaded temporarily.

2. **secret(recommended)** - A secret string which Companion uses to generate authorization tokens. You should generate a long random string for this.

3. **uploadUrls(recommended)** - An allowlist (array) of strings (exact URLs) or regular expressions. If specified, Companion will only accept uploads to these URLs. This is needed to make sure a Companion instance is only allowed to upload to your servers. **Omitting this leaves your system open to potential [SSRF](https://en.wikipedia.org/wiki/Server-side_request_forgery) attacks, and may throw an error in future `@uppy/companion` releases.**

4. **redisUrl(optional)** - URL to running Redis server. If this is set, the state of uploads would be stored temporarily. This helps for resumed uploads after a browser crash from the client. The stored upload would be sent back to the client on reconnection.

5. **redisOptions(optional)** - An object of [options supported by redis client](https://www.npmjs.com/package/redis#options-object-properties). This option can be used in place of `redisUrl`.

6. **redisPubSubScope(optional)** - Use a scope for the companion events at the Redis server. Setting this option will prefix all events with the name provided and a colon.

7. **server(optional)** - An object with details, mainly used to carry out oauth authentication from any of the enabled providers above. Though it’s optional, it’s required if you would be enabling any of the supported providers. The following are the server options you may set:

* `protocol` - `http | https` - even though companion itself always runs as http, you may want to set this to `https` if you are running a reverse https proxy in front of companion.
* `host` (required) - your server’s publically facing hostname (for example `example.com`).
* `oauthDomain` - if you have several instances of Companion with different (and perhaps dynamic) subdomains, you can set a single fixed domain (e.g `sub1.example.com`) to handle your OAuth authentication for you. This would then redirect back to the correct instance with the required credentials on completion. This way you only need to configure a single callback URL for OAuth providers.
* `path` - the server path to where the Uppy app is sitting (e.g if Companion is at `example.com/companion`, then the path would be `/companion`).
* `implicitPath` - if the URL’s path in your reverse proxy is different from your Companion path in your express app, then you need to set this path as `implicitPath`. So if your Companion URL is `example.com/mypath/companion`. Where the path `/mypath` is defined in your NGINX server, while `/companion` is set in your express app. Then you need to set the option `implicitPath` to `/mypath`, and set the `path` option to `/companion`.
* `validHosts` - if you are setting an `oauthDomain`, you need to set a list of valid hosts, so the oauth handler can validate the host of the Uppy instance requesting the authentication. This is essentially a list of valid domains running your Companion instances. The list may also contain regex patterns. e.g `['sub2.example.com', 'sub3.example.com', '(\\w+).example.com']`

8. **sendSelfEndpoint(optional)** - This is essentially the same as the `server.host + server.path` attributes. The major reason for this attribute is that, when set, it adds the value as the `i-am` header of every request response.

9. **providerOptions(optional)** - An object containing credentials (`key` and `secret`) for each provider you would like to enable. Please see [the list of supported providers](#Supported-providers).

10. **customProviders(optional)** - This option enables you to add custom providers along with the already supported providers. See [Adding Custom Providers](#Adding-custom-providers) for more information.

11. **debug(optional)** - A boolean flag to tell Companion whether to log useful debug information while running.

12. **logClientVersion(optional)** - A boolean flag to tell Companion whether to log its version upon startup.

13. **metrics(optional)** - A boolean flag to tell Companion whether to provide an endpoint `/metrics` with Prometheus metrics.

14. **streamingUpload(optional)** - A boolean flag to tell Companion whether to enable streaming uploads. If enabled, it will lead to _faster uploads_ because companion will start uploading at the same time as downloading using `stream.pipe`. If `false`, files will be fully downloaded first, then uploaded. Defaults to `false`. Do **not** set it to `true` if you have a [custom Companion provider](#adding-custom-providers) that does not use the new async/stream API.

15. **maxFileSize(optional)** - If this value is set, companion will limit the maximum file size to process. If unset, it will process files without any size limit (this is the default).

16. **periodicPingUrls(optional)** - If this value is set, companion will periodically send POST requests to the specified URLs. Useful for keeping track of companion instances as a keep-alive.

17. **periodicPingInterval(optional)** - Interval for periodic ping requests (in ms).

18. **periodicPingStaticPayload(optional)** - A `JSON.stringify`-able JavaScript Object that will be sent as part of the JSON body in the period ping requests.

19. **allowLocalUrls(optional)** - A boolean flag to tell Companion whether to allow requesting local URLs. Note: Only enable this in development. **Enabling it in production is a security risk.**

### Provider Redirect URIs

When generating your provider API keys on their corresponding developer platforms (e.g [Google Developer Console](https://console.developers.google.com/)), you’d need to provide a `redirect URI` for the OAuth authorization process. In general the redirect URI for each provider takes the format:

`http(s)://$YOUR_COMPANION_HOST_NAME/$PROVIDER_NAME/redirect`

For example, if your Companion server is hosted on `https://my.companion.server.com`, then the redirect URI you would supply for your OneDrive provider would be:

`https://my.companion.server.com/onedrive/redirect`

Please see [Supported Providers](https://uppy.io/docs/companion/#Supported-providers) for a list of all Providers and their corresponding names.

### S3 options

Companion comes with signature endpoints for AWS S3. These can be used by the Uppy client to sign requests to upload files directly to S3, without exposing secret S3 keys in the browser. Companion also supports uploading files from providers like Dropbox and Instagram directly into S3.

The S3 features can be configured using the `providerOptions.s3` property.

#### `providerOptions.s3.key`

The S3 access key ID. The standalone Companion server populates this with the value of the `COMPANION_AWS_KEY` environment variable by default.

#### `providerOptions.s3.secret`

The S3 secret access key. The standalone Companion server populates this with the value of the `COMPANION_AWS_SECRET` environment variable by default.

#### `providerOptions.s3.bucket`

The name of the bucket to store uploaded files in. The standalone Companion server populates this with the value of the `COMPANION_AWS_BUCKET` environment variable by default.

#### `providerOptions.s3.region`

The datacenter region where the target bucket is located. The standalone Companion server populates this with the value of the `COMPANION_AWS_REGION` environment variable by default.

#### `providerOptions.s3.awsClientOptions`

You can supply any [S3 option supported by the AWS SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property) in the `providerOptions.s3.awsClientOptions` object, _except for_ the below:

* `accessKeyId`. Instead, use the `providerOptions.s3.key` property. This is to make configuration names consistent between different Companion features.
* `secretAccessKey`. Instead, use the `providerOptions.s3.secret` property. This is to make configuration names consistent between different Companion features.

Be aware that some options may cause wrong behaviour if they conflict with Companion’s assumptions. If you find that a particular option does not work as expected, please [open an issue on the Uppy repository](https://github.com/transloadit/uppy/issues/new) so we can document it here.

#### `providerOptions.s3.getKey(req, filename, metadata)`

Get the key name for a file. The key is the file path to which the file will be uploaded in your bucket. This option should be a function receiving three arguments:

* `req`, the HTTP request, for _regular_ S3 uploads using the `@uppy/aws-s3` plugin. This parameter is _not_ available for multipart uploads using the `@uppy/aws-s3-multipart` plugin;
* `filename`, the original name of the uploaded file;
* `metadata`, user-provided metadata for the file. See the [`@uppy/aws-s3`](https://uppy.io/docs/aws-s3/#metaFields) docs. The `@uppy/aws-s3-multipart` plugin unconditionally sends all metadata fields, so they all are available here.

This function should return a string `key`. The `req` parameter can be used to upload to a user-specific folder in your bucket, for example:

```js
app.use(authenticationMiddleware)
app.use(uppy.app({
  providerOptions: {
    s3: {
      getKey: (req, filename, metadata) => `${req.user.id}/${filename}`,
      /* auth options */
    },
  },
}))
```

The default implementation returns the `filename`, so all files will be uploaded to the root of the bucket as their original file name.

```js
app.use(uppy.app({
  providerOptions: {
    s3: {
      getKey: (req, filename, metadata) => filename,
    },
  },
}))
```

### Running in Kubernetes

We have [a detailed guide on running Companion in Kubernetes](https://github.com/transloadit/uppy/blob/main/packages/%40uppy/companion/KUBERNETES.md) for you, that’s how we run our example server at <https://companion.uppy.io>.

### Adding custom providers

As of now, Companion supports the [providers listed here](https://uppy.io/docs/companion/#Supported-providers) out of the box, but you may also choose to add your own custom providers. You can do this by passing the `customProviders` option when calling the Uppy `app` method. The custom provider is expected to support Oauth 1 or 2 for authentication/authorization.

```javascript
import providerModule from './path/to/provider/module'

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
}

uppy.app(options)
```

The `customProviders` option should be an object containing each custom provider. Each custom provider would, in turn, be an object with two keys, `config` and `module`. The `config` option would contain Oauth API settings, while the `module` would point to the provider module.

To work well with Companion, the **module** must be a class with the following methods. Note that the methods must be `async`, return a `Promise` or reject with an `Error`):

1. `async list ({ token, directory, query })` - Returns a object containing a list of user files (such as a list of all the files in a particular directory). See [example returned list data structure](#list-data).
   `token` - authorization token (retrieved from oauth process) to send along with your request
   * `directory` - the id/name of the directory from which data is to be retrieved. This may be ignored if it doesn’t apply to your provider
   * `query` - expressjs query params object received by the server (in case some data you need in there).
2. `async download ({ token, id, query })` - Downloads a particular file from the provider. Returns an object with a single property `{ stream }` - a [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_readable), which will be read from and uploaded to the destination. To prevent memory leaks, make sure you release your stream if you reject this method with an error.
   * `token` - authorization token (retrieved from oauth process) to send along with your request.
   * `id` - ID of the file being downloaded.
   * `query` - expressjs query params object received by the server (in case some data you need in there).
3. `async size ({ token, id, query })` - Returns the byte size of the file that needs to be downloaded as a `Number`. If the size of the object is not known, `null` may be returned.
   * `token` - authorization token (retrieved from oauth process) to send along with your request.
   * `id` - ID of the file being downloaded.
   * `query` - expressjs query params object received by the server (in case some data you need in there).

The class must also have:

* A unique `authProvider` string property - a lowercased value which typically indicates the name of the provider (e.g “dropbox”).
* A `static` property `static version = 2`, which is the current version of the Companion Provider API.

See also [example code with a custom provider](https://github.com/transloadit/uppy/blob/main/examples/custom-provider/server).

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

## Migrating v1 to v2

### Prerequisite

Since v2, you now need to be running `node.js >= v10.20.1` to use Companion.

### ProviderOptions

In v2 the `google` and `microsoft` [providerOptions](https://uppy.io/docs/companion/#Options) have been changed to `drive` and `onedrive` respectively.

### OAuth Redirect URIs

On your Providers’ respective developer platforms, the OAuth redirect URIs that you should supply has now changed from:

`http(s)://$COMPANION_HOST_NAME/connect/$AUTH_PROVIDER/callback` in v1

to:

`http(s)://$COMPANION_HOST_NAME/$PROVIDER_NAME/redirect` in v2

#### New Redirect URIs

<div class="table-responsive">

| Provider | New Redirect URI
|-|-|
| Dropbox | `https://$COMPANION_HOST_NAME/dropbox/redirect` |
| Google Drive | `https://$COMPANION_HOST_NAME/drive/redirect` |
| OneDrive | `https://$COMPANION_HOST_NAME/onedrive/redirect` |
| Box | `https://$YOUR_COMPANION_HOST_NAME/box/redirect` |
| Facebook | `https://$COMPANION_HOST_NAME/facebook/redirect` |
| Instagram | `https://$COMPANION_HOST_NAME/instagram/redirect` |

</div>

## Development

1\. To set up Companion for local development, please clone the Uppy repo and install, like so:

```bash
git clone https://github.com/transloadit/uppy
cd uppy
yarn install
```

2\. Configure your environment variables by copying the `env.example.sh` file to `env.sh` and edit it to its correct values.

```bash
cp env.example.sh env.sh
$EDITOR env.sh
```

3\. To start the server, run:

```bash
yarn run start:companion
```

This would get the Companion instance running on `http://localhost:3020`. It uses [nodemon](https://github.com/remy/nodemon) so it will automatically restart when files are changed.

## Live example

An example server is running at <https://companion.uppy.io>, which is deployed with [Kubernetes](https://github.com/transloadit/uppy/blob/main/packages/%40uppy/companion/KUBERNETES.md)

## How the Authentication and Token mechanism works

This section describes how Authentication works between Companion and Providers. While this behaviour is the same for all Providers (Dropbox, Instagram, Google Drive, etc.), we are going to be referring to Dropbox in place of any Provider throughout this section.

The following steps describe the actions that take place when a user Authenticates and Uploads from Dropbox through Companion:

* The visitor to a website with Uppy clicks `Connect to Dropbox`.
* Uppy sends a request to Companion, which in turn sends an OAuth request to Dropbox (Requires that OAuth credentials from Dropbox have been added to Companion).
* Dropbox asks the visitor to log in, and whether the Website should be allowed to access your files
* If the visitor agrees, Companion will receive a token from Dropbox, with which we can temporarily download files.
* Companion encrypts the token with a secret key and sends the encrypted token to Uppy (client)
* Every time the visitor clicks on a folder in Uppy, it asks Companion for the new list of files, with this question, the token (still encrypted by Companion) is sent along.
* Companion decrypts the token, requests the list of files from Dropbox and sends it to Uppy.
* When a file is selected for upload, Companion receives the token again according to this procedure, decrypts it again, and thereby downloads the file from Dropbox.
* As the bytes arrive, Companion uploads the bytes to the final destination (depending on the configuration: Apache, a Tus server, S3 bucket, etc).
* Companion reports progress to Uppy, as if it were a local upload.
* Completed!
