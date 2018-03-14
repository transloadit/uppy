---
title: "Uppy Server"
type: docs
permalink: docs/server/
order: 2
---

Drag and Drop, Webcam, basic file manipulation (adding metadata, for example) and uploading via tus resumable uploads or XHR/Multipart are all possible using just the uppy client module.

However, if you add [uppy-server](https://github.com/transloadit/uppy-server) to the mix, your users will be able to select files from remote sources, such as Instagram, Google Drive and Dropbox, bypassing the client (so a 5 GB video isn’t eating into your users' data plans), and then uploaded to the final destination. Files are removed from uppy-server after an upload is complete, or after a reasonable timeout. Access tokens also don’t stick around for long, for security.

Uppy Server handles the server-to-server communication between your server and file storage providers such as Google Drive, Dropbox, Instagram, etc.

## Supported Providers

As of now uppy-server is integrated to work with:

- Google Drive
- Dropbox
- Instagram
- Remote Urls
- Amazon S3

## Install

```bash
npm install uppy-server
```

## Usage

Uppy-server may either be used as a pluggable express app, which you plug to your already existing server, or it may simply be run as a standalone server:

### Plug to already existing server

To plug uppy-server to an existing server, simply call on its `.app` method, passing in an [options](#Options) object as parameter.

```javascript

var express = require('express')
var bodyParser = require('body-parser')
var session = require('express-session')
var uppy = require('uppy-server')

var app = express()
app.use(bodyParser.json())
app.use(session({secret: 'some secrety secret'}))
...
// be sure to place this anywhere after app.use(bodyParser.json()) and app.use(session({...})
const options = {
  providerOptions: {
    google: {
      key: 'GOOGLE_KEY',
      secret: 'GOOGLE_SECRET'
    }
  },
  server: {
    host: 'localhost:3020',
    protocol: 'http',
  },
  filePath: '/path/to/folder/'
}

app.use(uppy.app(options))

```
See [Options](#Options) for valid configuration options.

To enable uppy socket for realtime upload progress, you can call the `socket` method like so.

```javascript
...
var server = app.listen(PORT)

uppy.socket(server, options)

```
This takes your `server` instance and your uppy [options](#Options) as parameters.

### Run uppy-server on kuberenetes

You can use our docker container to run uppy-server on kubernetes with the following configuration.
```bash
kubectl create ns uppy
```
We will need a Redis container that we can get through [helm](https://github.com/kubernetes/helm)

```bash
 helm install --name uppy \
  --namespace uppy \
  --set redisPassword=superSecretPassword \
    stable/redis
```

> uppy-server-env.yml
```yaml
apiVersion: v1
data:
  UPPY_ENDPOINTS: "localhost:3452,uppy.io"
  UPPYSERVER_DATADIR: "PATH/TO/DOWNLOAD/DIRECTORY"
  UPPYSERVER_DOMAIN: "YOUR SERVER DOMAIN"
  UPPYSERVER_DOMAINS: "sub1.domain.com,sub2.domain.com,sub3.domain.com"
  UPPYSERVER_PROTOCOL: "YOUR SERVER PROTOCOL"
  UPPYSERVER_REDIS_URL: redis://:superSecretPassword@uppy-redis.uppy.svc.cluster.local:6379
  UPPYSERVER_SECRET: "shh!Issa Secret!"
  UPPYSERVER_DROPBOX_KEY: "YOUR DROPBOX KEY"
  UPPYSERVER_DROPBOX_SECRET: "YOUR DROPBOX SECRET"
  UPPYSERVER_GOOGLE_KEY: "YOUR GOOGLE KEY"
  UPPYSERVER_GOOGLE_SECRET: "YOUR GOOGLE SECRET"
  UPPYSERVER_INSTAGRAM_KEY: "YOUR INSTAGRAM KEY"
  UPPYSERVER_INSTAGRAM_SECRET: "YOUR INSTAGRAM SECRET"
  UPPYSERVER_AWS_KEY: "YOUR AWS KEY"
  UPPYSERVER_AWS_SECRET: "YOUR AWS SECRET"
  UPPYSERVER_AWS_BUCKET: "YOUR AWS S3 BUCKET"
  UPPYSERVER_AWS_REGION: "AWS REGION"
  UPPYSERVER_OAUTH_DOMAIN: "sub.domain.com"
  UPPYSERVER_UPLOAD_URLS: "http://master.tus.io/files/,https://master.tus.io/files/"
kind: ConfigMap
metadata:
  name: uppy-server-env
  namespace: uppy
```

> uppy-server-deployment.yml
```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: uppy-server
  namespace: uppy
spec:
  replicas: 2
  minReadySeconds: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: uppy-server
    spec:
      containers:
      - image: docker.io/transloadit/uppy-server:latest
        imagePullPolicy: ifNotPresent
        name: uppy-server        
        resources:
          limits:
            memory: 150Mi
          requests:
            memory: 100Mi
        envFrom:
        - configMapRef:
            name: uppy-server-env
        ports:
        - containerPort: 3020
        volumeMounts:
        - name: uppy-server-data
          mountPath: /mnt/uppy-server-data
      volumes:
      - name: uppy-server-data
        emptyDir: {}
```

`kubectl apply -f uppy-server-deployment.yml`

> uppy-server-service.yml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: uppy-server
  namespace: uppy
spec:
  ports:
  - port: 80
    targetPort: 3020
    protocol: TCP
  selector:
    app: uppy-server
```

`kubectl apply -f uppy-server-service.yml`


You can check the full list of possible environment variables here: 

```bash
####### Mandatory variables ###########

# any long set of random characters for the server session
UPPYSERVER_SECRET="shh!Issa Secret!"
# corresponds to the server.host option
UPPYSERVER_DOMAIN="YOUR SERVER DOMAIN"
# corresponds to the filePath option
UPPYSERVER_DATADIR="PATH/TO/DOWNLOAD/DIRECTORY"

###### Optional variables ##########

# corresponds to the server.protocol option. defaults to http
UPPYSERVER_PROTOCOL="YOUR SERVER PROTOCOL"
# the port to start the server on. defaults to 3020
UPPYSERVER_PORT="YOUR SERVER PORT"
# corresponds to the server.port option. defaults to ''
UPPYSERVER_PATH="/SERVER/PATH/TO/WHERE/UPPY-SERVER/LIVES"

# use this in place of UPPYSERVER_PATH if the server path should not be
# handled by the express.js app but maybe by an external server configuration
# instead (e.g Nginx).
UPPYSERVER_IMPLICIT_PATH="/SERVER/PATH/TO/WHERE/UPPY/SERVER/LIVES"

# comma separated client hosts to whitlelist by the server
# if not specified, the server would allow any host
UPPY_ENDPOINTS="localhost:3452,uppy.io"

# corresponds to the redisUrl option
# This also enables redis session storage if set
UPPYSERVER_REDIS_URL="REDIS URL"

# to enable Dropbox
UPPYSERVER_DROPBOX_KEY="YOUR DROPBOX KEY"
UPPYSERVER_DROPBOX_SECRET="YOUR DROPBOX SECRET"

# to enable Google Drive
UPPYSERVER_GOOGLE_KEY="YOUR GOOGLE KEY"
UPPYSERVER_GOOGLE_SECRET="YOUR GOOGLE SECRET"

# to enable Instagram
UPPYSERVER_INSTAGRAM_KEY="YOUR INSTAGRAM KEY"
UPPYSERVER_INSTAGRAM_SECRET="YOUR INSTAGRAM SECRET"

# to enable s3
UPPYSERVER_AWS_KEY="YOUR AWS KEY"
UPPYSERVER_AWS_SECRET="YOUR AWS SECRET"
UPPYSERVER_AWS_BUCKET="YOUR AWS S3 BUCKET"
UPPYSERVER_AWS_REGION="AWS REGION"

# corresponds to the server.oauthDomain option
UPPYSERVER_OAUTH_DOMAIN="sub.domain.com"
# corresponds to the server.validHosts option
UPPYSERVER_DOMAINS="sub1.domain.com,sub2.domain.com,sub3.domain.com"

# corresponds to the sendSelfEndpoint option
UPPYSERVER_SELF_ENDPOINT="THIS SHOULD BE SAME AS YOUR DOMAIN + PATH"

# comma separated urls
# corresponds to the uploadUrls option
UPPYSERVER_UPLOAD_URLS="http://master.tus.io/files/,https://master.tus.io/files/"
```

### Options

```javascript
{
  providerOptions: {
    google: {
      key: "***",
      secret: "***"
    },
    dropbox: {
      key: "***",
      secret: "***"
    },
    instagram: {
      key: "***",
      secret: "***"
    },
    s3: {
      getKey: (req, filename) => filename,
      key: "***",
      secret: "***",
      bucket: "bucket-name",
      region: "us-east-1"
    }
  },
  server: {
    host: "localhost:3020", // or yourdomain.com
    protocol: "http"
  },
  filePath: "path/to/download/folder",
  sendSelfEndpoint: "localhost:3020",
  secret: 'mysecret',
  uploadUrls: ['https://myuploadurl.com', 'http://myuploadurl2.com']
  debug: true
}
```

1. **filePath(required)** - Full path to the directory where provider files would temporarily be downloaded to.

2. **redisUrl(optional)** - URL to running redis server. If this is set, the state of uploads would be stored temporarily. This helps for resumed uploads after a browser crash from the client. The stored upload would be sent back to the client on reconnection.

3. **providerOptions(optional)** - An object containing credentials (`key` and `secret`) for each provider you would like to enable. Please see [here for the list of supported providers](#Supported-Providers).

4. **server(optional)** - An object with details mainly used to carry out oauth authentication from any of the enabled providers above. Though it is optional, it is required if you would be enabling any of the supported providers. The following are the server options you may set:

  - protocol - `http | https`
  - host(required) - your server host (e.g localhost:3020, mydomain.com)
  - path - the server path to where the uppy app is sitting (e.g if uppy server is at `mydomain.com/uppy`, then the path would be `/uppy`).
  - oauthDomain - if you have multiple instances of uppy server with different (and maybe dynamic) subdomains, you can set a master domain (e.g `sub1.mydomain.com`) to handle your oauth authentication for you. This would then redirect to the slave subdomain with the required credentials on completion.
  - validHosts - if you are setting a master `oauthDomain`, you need to set a list of valid hosts, so the master oauth handler can validate the host of the uppy instance requesting the authentication. This is basically a list of valid domains running your uppy server instances. The list may also contain regex patterns. e.g `['sub2.mydomain.com', 'sub3.mydomain.com', '(\\w+).mydomain.com']`

5. **sendSelfEndpoint(optional)** - This is basically the same as the `server.host + server.path` attributes. The major reason for this attribute is that, when set, it adds the value as the `i-am` header of every request response.

6. **customProviders(optional)** - This option enables you to add custom providers along with the already supported providers. See [Adding Custom Providers](#Adding-Custom-Providers) for more information.

7. **uploadUrls(optional)** - An array of urls (full path), which uppy-server should only upload to (i.e uploads will not be permitted to other urls, except for those specified in this array).

8. **secret(required)** - A secret string which uppy uses to generate authorization tokens.

9. **debug(optional)** - A boolean flag to tell uppy whether or not to log useful debug information while running.

### S3 Options

The S3 uploader has some options in addition to the ones necessary for authentication.

#### `s3.getKey(req, filename)`

Get the key name for a file. The key is the file path that the file will be uploaded to in your bucket. This option should be a function receiving two arguments: `req`, the HTTP request, and the original `filename` of the uploaded file. It should return a string `key`. The `req` parameter can be used to upload to a user-specific folder in your bucket, for example:

```js
app.use(authenticationMiddleware)
app.use(uppy.app({
  s3: {
    getKey: (req, filename) => `${req.user.id}/${filename}`,
    /* auth options */
  }
}))
```

The default value simply returns `filename`, so all files will be uploaded to the root of the bucket as their original file name.

### Adding Custom Providers

As of now, uppy-server supports **Google Drive**, **Dropbox** and **Instagram** out of the box, but you may also choose to add your custom providers. You can do this by passing the `customProviders` option when calling the uppy `app` method. The custom provider is expected to support Oauth 1 or 2 for authentication/authorization.

```javascript
let options = {
    customProviders: {
        myprovidername: {
            config: {
                authorize_url: "https://mywebsite.com/authorize",
                access_url: "https://mywebsite.com/token",
                oauth: 2,
                key: "***",
                secret: "**",
                scope: ["read", "write"]
            },
            module: require('/path/to/provider/module')
        }
    }
}

uppy.app(options)
```

The `customProviders` option should be an object containing each custom provider. Each custom provider would in turn be an object with two keys, `config` and `module`. The `config` option would contain Oauth API settings, while the `module` would point to the provider module.

To work well with uppy server, the **Module** must be a class with the following methods.

1. `list (options, done)` - lists json data of user files (e.g list of all the files in a particular directory).
  - `options` - is an object containing the following attributes
    - token - authorization token(retrieved from oauth process) to send along with your request
    - directory - the `id/name` of the directory whose data is to be retrieved. This may be ignored if it doesn't apply to your provider
    - query - expressjs query params object received by the server(just in case there's some data you need in there).
  - `done (err, response, body)` - the callback that should be called when the request to your provider is done. As the signature indicates the following data should be passed along to the callback `err`, `response`, and `body`.
2. `download (options, onData, onResponse)` - downloads a particular file from the provider.
  - `options` - is an object containing the following attributes
    - token - authorization token(retrieved from oauth process) to send along with your request.
    - id - id of the file being downloaded.
  - `onData (chunk)` - a callback that should be called with each data chunk received on download. This is useful if the size of the downloaded file can be pre-determined. This would allow for pipelined upload of the file (to the desired destination), while the download is still going on.
  - `onResponse (response)` - if the size of the downloaded file can not be pre-determined by uppy-server, then this callback should be called in place of the `onData` callback. This callback would be called after the download is done, and would take the downloaded data (response) as the argument.

## Development

1\. To setup uppy-server for local development, please clone the repo and install like so:

```bash
git clone https://github.com/transloadit/uppy-server && cd uppy-server && npm install
```

2\. Configure your enviorment variables by copying the `env.example.sh` file to `env.sh` and edit it to its correct values.

```bash
cp env.example.sh env.sh
$EDITOR env.sh
```

3\. To start the server, simply run:

```bash
npm run start:dev
```

This would get the uppy-server running on `http://localhost:3020`.

It also expects the [uppy client](https://github.com/transloadit/uppy) to be running on `http://localhost:3452` by default.

## Running example

You can checkout uppy-server [repository](https://github.com/transloadit/uppy-server) to see how we run [server.uppy.io](https://server.uppy.io).

## Logging

You can check the production logs for the production pod using: 

```bash
kubectl logs my-pod-name 
```