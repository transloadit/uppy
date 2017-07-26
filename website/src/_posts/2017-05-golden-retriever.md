---
title: "Golden Retriever: sneak peak of an exciting file recovering feature"
date: 2017-07-28
author: arturi
published: false
---

Don’t you just hate it when you’re on your favorite photo sharing website, and you’ve selected a few perfect images from your recent trip to Iceland, and they’re half uploaded, when a huge artificial dog bone falles from the sky and lands on a “quit“ button, crashing your dreams? Or the battery dies in your laptop? Or you accidentaly hit “back” button or close the tab? Or your browser just crashes out of the blue? We hate that too!

Uppy team is remote (accross 3 continents and 5 cities), and some of us have never met in person, with communication happening in Slack. Recently we got together in Berlin for an insanely cool week of pink limo rides, Indian food and Mario Kart 64. More on that coming soon on [Transloadit blog](https://transloadit.com/blog/).

[insert picture or two here]

While eating famous Flammkuchen, we’ve been thinking about making file uploading better (yes, we can’t stop thinking about that). We then sat together in one room for a few days of hacking and came up with something really cool. Meet Golden Retriever, the file restoring plugin.

```js
uppy.use(GoldenRetriever)
```

<!-- more -->

## 👻 How it works

Golden Retriever is built on [the prototype](https://github.com/transloadit/uppy/issues/237) by [@richardwillars](https://github.com/richardwillars) and uses Service Worker, Local Storage and IndexedDB to save files you add to Uppy. Here’s how it’s currently set up: 

1. Local Storage stores all files from `state.files`, without blobs, and restores them on boot.
2. Service Worker stores references to all file blobs in memory. This should persist when navigating away from a page or closing browser tab, but will get destroyed after a browser crash / quit.
3. IndexedDB stores all files that can be reasonably stored there, 10 MB per file, 300 MB in total. This lives until the browser decides to do a cleanup.
4. Then, on boot, we try to restore all blobs from Service Worker’s cache, and IndexedDB persistant storage.
5. If upload was already in progress before the crash/refresh, and especially if it was resumable (via [tus](http://tus.io), for example), Golden Retriever just picks up from where it all went south.
6. When files are successfully uploaded, or you delete them, they are removed from all caches and “permanent” storages.

## 🚦 Try in alpha

Golden Retriever already works and feels like magic :sparkles:, but it is still quite unstable, and haven’t been tested on different devices. We encorage you to try it out and give your feedback in [#268](https://github.com/transloadit/uppy/pull/268) PR :tada:

The Uppy Team
