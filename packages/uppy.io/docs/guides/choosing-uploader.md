---
sidebar_position: 1
---

# Choosing the uploader you need

Versatile, reliable uploading is at the heart of Uppy. It has many configurable
plugins to suit your needs. In this guide we will explain the different plugins,
their strategies, and when to use them based on use cases.

## Use cases

### I want worry-free, plug-and-play uploads with Transloadit services

Transloadit’s strength is versatility. By doing video, audio, images, documents,
and more, you only need one vendor for [all your file processing
needs][transloadit-services]. The [`@uppy/transloadit`][] plugin directly
uploads to Transloadit so you only have to worry about creating a
[template][transloadit-concepts]. It uses
[Tus](#i-want-reliable-resumable-uploads) under the hood so you don’t have to
sacrifice reliable, resumable uploads for convenience.

You should use [`@uppy/transloadit`][] if you don’t want to host your own
server, (optionally) need file processing, and store it in the service (such as
S3 or GCS) of your liking. All with minimal effort.

### I want reliable, resumable uploads

[Tus][tus] is a new open protocol for resumable uploads built on HTTP. This
means accidentally closing your tab or losing connection let’s you continue, for
instance, your 10GB upload instead of starting all over.

Tus supports any language, any platform, and any network. It requires a client
and server integration to work. You can checkout the client and server
[implementations][tus-implementations] to find the server in your preferred
language. You can store files on the Tus server itself, but you can also use
service integrations (such as S3) to store files externally.

If you want reliable, resumable uploads: use [`@uppy/tus`][] to connect to your
Tus server in a few lines of code.

:::tip

If you plan to let people upload _a lot_ of files, [`@uppy/tus`][] has
exponential backoff built-in. Meaning if your server (or proxy) returns HTTP 429
because it’s being overloaded, [`@uppy/tus`][] will find the ideal sweet spot to
keep uploading without overloading.

:::

### I want to upload to AWS S3 (or S3-compatible storage) directly

When you prefer a _client-to-storage_ over a _client-to-server-to-storage_ (such
as [Transloadit](/docs/transloadit) or [Tus](/docs/tus)) setup. This may in some
cases be preferable, for instance, to reduce costs or the complexity of running
a server and load balancer with [Tus](/docs/tus). Uppy has the
[`@uppy/aws-s3`][] plugin for this. It supports both multipart and non-multipart
uploads (controlled by the `shouldUseMultipart` option.

:::info

You can also save files in S3 with the [`/s3/store`][s3-robot] robot while still
using the powers of Transloadit services.

:::

### I want to send regular HTTP uploads to my own server

[`@uppy/xhr-upload`][] handles classic HTML multipart form uploads as well as
uploads using the HTTP `PUT` method.

[s3-robot]: https://transloadit.com/services/file-exporting/s3-store/
[transloadit-services]: https://transloadit.com/services/
[transloadit-concepts]: https://transloadit.com/docs/getting-started/concepts/
[`@uppy/transloadit`]: /docs/transloadit
[`@uppy/tus`]: /docs/tus
[`@uppy/aws-s3`]: /docs/aws-s3
[`@uppy/xhr-upload`]: /docs/xhr-upload
[tus]: https://tus.io/
[tus-implementations]: https://tus.io/implementations.html
