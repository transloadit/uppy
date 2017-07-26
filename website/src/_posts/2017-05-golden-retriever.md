---
title: "The Golden Retriever: Uploads that survive a browser crash"
date: 2017-07-28
author: arturi
published: false
---

Don’t you just hate it when you're about to share the perfect images from your trip to Iceland, and halfway through your cat jumps on the keyboard and trashes your browser? Or the battery in your laptop dies? Or you accidentally close the tab or navigate away? We hate that too!

But there's some good news, we found a way to get those Iceland pics in the hands of your loved ones with near-zero frustration levels, even after a Blue screens of death! (is that still a thing?) 

<!-- more -->

First off, let's show you a demo of Uppy surviving a browser crash and picking up right where we left off 📹

[insert video]

## Uppy?

For those new here, Uppy is the next-gen open source file uploader for the web. It's made by Transloadit as hence works great with their uploading & encoding platform, but it also works great without. Just add Uppy JavaScript to your website, deploy your own tusd/Apache/Nginx server, and be on your way. Uppy's focus is on the modern web, and we go through extreme lengths to achieve the smoothest of user experiences, and the most durable of reliabilities 🙃

## Hacking trip

Our core team is remote (3 continents, 5 cities), and most of us have never met in person, with communication happening in GitHub & Slack. Just last week we got together in Berlin for a crazy week of pink limo rides, Indian food and Mario Kart 64. More on that coming soon on [Transloadit blog](https://transloadit.com/blog/).

[insert picture or two here]

While eating famous "Flammkuchen", we’ve been thinking about making file uploading better (yes, we can’t stop thinking about that). We then sat together in one room for a few days of hacking and came up with something really cool. 

## The Golden Retriever

Meet the Golden Retriever, our file recovery plugin:

<!-- sorry about the center :o -->
<center>
  <img class="border" src="/images/blog/golden-retriever/catch-fail-2.gif" alt="Golden Retriever failing to catch something" title="Good try, boy!">
</center>

As you can see, we still have some more training to do 😄

Couldn't we already resume uploads thanks to [tus.io](https://tus.io)? Yes, and this works great to recover from poor network conditions, but if your browser crashed and restarted, Uppy had no idea anymore what it was doing, and you could start all over. 

<!-- sorry about more centers :o -->
<center>
  <img class="border" src="/images/blog/golden-retriever/no-idea-dog-3.gif" alt="Dog has no idea what he is doing" title="Good try, boy!">
</center>

If games can have checkpoints, why can't Uppy? Turns out, it can! And mandy of them. The Golden Retriever saves its memory (state) in browser cache with every move you make. Then when Uppy suddenly crashes for whatever reason, it can find this memory when it starts, and offer to resume where you left off. Sounds simple enough right? Why hasn't anybody attempted this before?

Turns out there are some tricky problems. One of them is that because of security reasons, Uppy isn't allowed to access files from your harddisk without the user explicity (re)selecting them. Reasonable, but this meant that we had to deploy a number of workarounds that, while it may upset our inner purist a little, combined, now amount to a pretty sweet user experience for the majority of cases. And that's in the end, what Uppy is all about: pleasing and delighting its users.

## 👻 How it works

If you really want to know..

The Golden Retriever Plugin is built on [a prototype](https://github.com/transloadit/uppy/issues/237) by [@richardwillars](https://github.com/richardwillars) and uses a combination of Local Storage, Service Worker and IndexedDB to persist and retrieve the files you add to Uppy. Here's what goes where: 

- Local Storage stores all files from `state.files`, without blobs (the actual data of the file), and restores this meta information on boot.
- Service Worker stores references to all file blobs in memory. This should persist when navigating away from a page or closing browser tab, but will get destroyed after a browser crash / quit.
- IndexedDB stores all files that can be reasonably stored there, 10 MB per file, 300 MB in total. This lives until the browser or Uppy decide to do a cleanup.

Now when Uppy starts, we restore all meta information from Local Storage to get an idea of what was going on. For the blobs, we try to recover from both the Service Worker and IndexedDB. This goes a long way into supporting many cases out there. Since we have meta on all the files, even the ones whose data was e.g. too big to fit into IndexedDB, we let the user know which files to re-select by marking them with a ghost icon:

<center>
  <img class="border" src="/images/blog/golden-retriever/desktop-ghost.png" alt="Design mockup with ghosts" title="Design mockup with ghosts">
</center>

If an upload was already in progress before the crash/refresh, and especially if it was resumable (via [tus](https://tus.io) for example), Golden Retriever just picks up from where it all went south. The Golden Retriever also cleans up after herself: when files are successfully uploaded, or you delete them, they are removed from all “permanent” storages.

## 🚦 Try in alpha

Golden Retriever already works and feels like magic :sparkles:, but it is also unstable, and hasn’t been tested on all the different devices yet. We encourage you to try it out and give your feedback in the [#268](https://github.com/transloadit/uppy/pull/268) PR :tada:

Here's how you'd go about it. First you:

[insert instructions for getting your hands on the latest build]

and then enable the plugin:

```js
const GoldenRetriever = require('uppy/lib/plugins/GoldenRetriever')
// [don't we need to also require our service worker here somehow?]
uppy.use(GoldenRetriever)
```

Enjoy, and do let us know in that [PR](https://github.com/transloadit/uppy/pull/268) how it turned out for you!

The Uppy Team
