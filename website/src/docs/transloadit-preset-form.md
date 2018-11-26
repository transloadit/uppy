---
type: docs
title: "Transloadit Preset: Form API"
menu: "Form"
permalink: docs/transloadit-preset/form/
order: 12
---

Add resumable uploads and Transloadit's processing to your existing HTML upload forms. Selected files will be uploaded to Transloadit, and the Assembly information will be submitted to your form endpoint.

```html
<form id="myForm" method="POST" action="/upload">
  <input type="file" multiple>
  ...
</form>

<script>
transloadit.form('form#myForm', {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
</script>
```

When the user submits the form, we intercept it and send the files to Transloadit instead. This creates one or more Assemblies depending on configuration. Then, we put the status JSON object(s) in a hidden input field named `transloadit`.

```html
<input type="hidden" name="transloadit" value='[{"ok": "ASSEMBLY_EXECUTING",...}]'>
```

Finally, we _really_ submit the form—without files, but with those Assembly status objects. You can then handle that in your backend.

## Progress Reporting

**TODO have an option to mount a status bar somewhere**

## Dashboard

**TODO have an option to replace the inputs with a Dashboard modal button?**
