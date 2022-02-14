---
type: docs
title: "Robodog: Dashboard API"
menu: "Robodog Dashboard"
permalink: docs/robodog/dashboard/
order: 4
category: "File Processing"
---

Add the [Dashboard UI][dashboard] to your page, all wired up and ready to go! This is a wrapper around the [Transloadit][transloadit] and [Dashboard][dashboard] plugins. Unlike the [File Picker][file picker] API, this Dashboard is embedded directly into the page. Users can upload many files after another.

```html
<div id="dashboard"></div>

<script>
Robodog.dashboard('#dashboard', {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
</script>
```

This API can still be used as a modal, too, by specifying `inline: false`:

```js
Robodog.dashboard(selector, { inline: false })
```

The `Robodog.dashboard()` function returns an Uppy instance, which you can use to listen for any Uppy events.

```js
const uppy = Robodog.dashboard(selector, { ...options })
  .on('transloadit:result', (result) => {
    console.log(result)
  })
```

## Transloadit

Most options to the [Transloadit][transloadit] plugin are supported except for `id`.

## Restrictions

Set rules and conditions to limit the type and/or number of files that can be selected. Restrictions are configured by the `restrictions` option.

### `restrictions.maxFileSize`

Maximum file size in bytes for each individual file.

### `restrictions.minFileSize`

Minimum file size in bytes for each individual file.

### `restrictions.maxTotalFileSize`

Maximum file size in bytes for all the files together.

### `restrictions.maxNumberOfFiles`

The total number of files that can be selected. If this is larger than 1, the `multiple` attribute will be added to `<input type="file">` fields.

### `restrictions.minNumberOfFiles`

The minimum number of files that must be selected before the upload. The upload will fail and the form will not be submitted if fewer files were selected.

### `restrictions.allowedFileTypes`

Array of mime type wildcards `image/*`, exact mime types `image/jpeg`, or file extensions `.jpg`: `['image/*', '.jpg', '.jpeg', '.png', '.gif']`.

If provided, the [`<input accept>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#Limiting_accepted_file_types) attribute will be added to `<input type="file">` fields, so only acceptable files can be selected in the system file dialog.

## Using your own OAuth applications when importing files

When importing files from remote providers, Transloadit’s OAuth applications are used by default. Your users will be asked to provide Transloadit access to their files. Since your users are probably not aware of Transloadit, this may be confusing or decrease trust. You may also hit rate limits, because the OAuth application is shared between everyone using Transloadit.

You can use your own OAuth keys with Transloadit’s hosted Companion servers by using Transloadit Template Credentials. [Create a Template Credential][template-credentials] on the Transloadit site. Select “Companion OAuth” for the service, and enter the key and secret for the provider you want to use. Then you can pass the name of the new credentials to that provider:

```js
Robodog.dashboard({
  providers: ['dropbox'],
  dropbox: {
    credentialsName: 'my_companion_dropbox_creds',
  },
})
```

Users will now be asked to allow _your_ application access, and they’re probably already familiar with that!

[dashboard]: /docs/dashboard

[transloadit]: /docs/transloadit

[file picker]: /docs/robodog/picker

[template-credentials]: https://transloadit.com/docs/#how-to-create-template-credentials
