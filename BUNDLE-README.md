# Uppy

Hi, thanks for trying out the bundled version of the Uppy File Uploader. You can use
this from a CDN (e.g. `<script src="https://releases.transloadit.com/uppy/v1.30.0/uppy.min.js"></script>`) or bundle it with your webapp. 

Note that the recommended way to use Uppy is to install it with yarn/npm and use a 
bundler like Webpack so that you can create a smaller custom build with just the
things that you need. More info on <https://uppy.io/docs/#With-a-module-bundler>.

## How to use this bundle

You can extract the contents of this zip to e.g. `./js/uppy`

Now you can create an HTML file, e.g.: `./upload.html` with the following contents:

```html
<html>
<head>
  <link rel="stylesheet" href="./js/uppy/uppy.min.css">
</head>

<body>
  <div class="DashboardContainer"></div>
  <button class="UppyModalOpenerBtn">Upload</button>
  <div class="uploaded-files">
    <h5>Uploaded files:</h5>
    <ol></ol>
  </div>
</body>

<script src="./js/uppy/uppy.min.js"></script>
<script>
  var uppy = Uppy.Core({
    debug      : true,
    autoProceed: false,
  })
    .use(Uppy.Dashboard, {
      browserBackButtonClose: false,
      height                : 470,
      inline                : false,
      replaceTargetContent  : true,
      showProgressDetails   : true,
      target                : '.DashboardContainer',
      trigger               : '.UppyModalOpenerBtn',
      metaFields            : [
        { id: 'name', name: 'Name', placeholder: 'file name' },
        { id: 'caption', name: 'Caption', placeholder: 'describe what the image is about' }
      ]
    })
    .use(Uppy.Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
    .on('upload-success', function (file, response) {
      var url      = response.uploadURL
      var fileName = file.name

      document.querySelector('.uploaded-files ol').innerHTML +=
        '<li><a href="' + url + '" target="_blank">' + fileName + '</a></li>'
    })
</script>
```

Now open `upload.html` in your browser, and the Uppy Dashboard will appear.

## Next steps

In the example you just built, Uppy uploads to a demo server where files will be deleted
shortly after uploading. You'll want to target your own tusd server, S3 bucket, or Nginx/Apache server. For the latter, use the Xhr plugin: <https://uppy.io/docs/xhr-upload/> which uploads using regular multipart form posts, that you'll existing Ruby or PHP backend will be able to make sense of, just as if a `<input type="file">` had been used.

The Dashboard currently opens when clicking the button, but you can also draw it inline into the page. This, and many more configuration options can be found here: <https://uppy.io/docs/dashboard/>.

Uppy has many more Plugins besides Xhr and the Dashboard. For example, you can enable Webcam, Instagram, or video encoding support. For a full list of Plugins check here: <https://uppy.io/docs/plugins/>.

Note that for some Plugins, you will need to run a server side component called: Companion. Those plugins are marked with a (c) symbol. Alternatively, you can sign up for a free Transloadit account. Transloadit runs Companion for you, tusd servers to handle resumable file uploads, and can post-process files to scan for viruses, recognize faces, etc. Check: <https://transloadit.com>.

## Getting help

Stuck with anything? We're welcoming all your questions and feedback over at <https://community.transloadit.com/c/uppy/5>.
