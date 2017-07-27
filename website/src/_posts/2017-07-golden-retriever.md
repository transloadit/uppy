---
title: "The Golden Retriever: Browser-crash-surviving Uploads"
date: 2017-07-28
author: arturi
published: false
---

Don’t you just hate it when you're about to share the perfect photos from your trip to Iceland, and halfway through your cat jumps on the keyboard and trashes your browser? Or the battery in your laptop dies? Or you accidentally close the tab or navigate away? We hate that too!

If action games have had checkpoints since 1687 - why can't file uploaders? Well, it turns out, they can! We found a way to get those Iceland pics in the hands of your loved ones with near-zero frustration levels, even after a Blue screens of death! (if that is still a thing) 

<!-- more -->

First off, let's show you a demo of Uppy surviving a browser crash and picking up right where we left off 📹

[insert video]

<video alt="Demo video showing the Golden Retriever file restoring plugin in action">
  <source src="/images/blog/golden-retriever/uppy-golden-retriever-crash-demo.mp4" type="video/mp4">
</video>

## Uppy?

For those new here, Uppy is the next-gen open source file uploader for the web. It's made by Transloadit as hence works great with their uploading & encoding platform, but it also works great without. Just add Uppy JavaScript to your website, deploy your own tusd/Apache/Nginx server, and be on your way. Uppy's focus is on the modern web, and we go through extreme lengths to achieve the smoothest of user experiences, and the most durable of reliabilities 🙃

## Hacking trip

Our core team is remote (3 continents, 5 cities), and most of us have never met in person, with communication happening in GitHub & Slack. Just last week we got together in Berlin for a crazy week of pink limo rides, Indian food and Mario Kart 64. More on that coming soon on [Transloadit blog](https://transloadit.com/blog/).

[insert picture or two here]

While eating famous "Flammkuchen", we’ve been thinking about making file uploading better (yes, we can’t stop thinking about that). We then sat together in one room for a few days of hacking and came up with something neat. 

## The Golden Retriever

Meet the Golden Retriever, our file recovery plugin:

<!-- sorry about the center :o -->
<center>
  <img class="border" src="/images/blog/golden-retriever/catch-fail-2.gif" alt="Golden Retriever failing to catch something" title="Good try, boy!">
</center>

As you can see, we're not fully done yet with training him, but we're getting there 😄

Couldn't we already resume uploads thanks to [tus.io](https://tus.io)? Yes, and this works great to recover from poor network conditions, but if your browser crashed and restarted, Uppy had no idea anymore what it was doing, and you could start all over. 

<!-- sorry about more centers :o -->
<center>
  <img class="border" src="/images/blog/golden-retriever/no-idea-dog-3.gif" alt="Dog has no idea what he is doing" title="Good try, boy!">
</center>

The Golden Retriever saves its memory (state) in browser cache with every move you make. Then when Uppy suddenly crashes for whatever reason, it can find this memory when it starts, and offer to resume where you left off. Sounds simple enough right? Why hasn't anybody attempted this before?

Turns out it's tricky. For one thing, no other competing file uploader uses tusm and resuming uploads without standardized and scrutinized components is asking for more problems than you're trying to solve. But with tus, we're standing on the shoulders of a giant and need not worry about the resumability aspect of the transmission.

So then it becomes about remembering what was going on with file selection & uploading right before the crash. One big issues here is that because of security reasons, Uppy isn't allowed to access to the selected files from your harddisk anymore after a crash. Reasonable, but this meant that we had to deploy a number of workarounds that, while it may upset our inner purist a little, combined, now amount to a pretty sweet user experience for the majority of cases. And that's in the end, what Uppy is all about: pleasing and delighting its users.

## 👻 How it works

If you really want to know..

Because we cannot access the file that we were uploading from disk, we cache them inside the browser.

It all started with a [a prototype](https://github.com/transloadit/uppy/issues/237) by [Richard Willars](https://github.com/richardwillars) which used a Service Worker to store files & state in. Service Workers are great for when you close a tab, but when the browser dies, so does the Service Worker. Also: iOS does not support it. So we looked at Local Storage is near-universally available and which _can_ survive a browser crash, but you can't store blobs in it. So we considered IndexedDB which _can_ store blobs in it, but is less available and has severe limits on how much you can/should store in it.

Since all of these technologies came with their own drawbacks, which one should be pick?

All of them. By combining the three of they cover eachother's shortcomings with eachother feats. Here's what goes where: 

- Local Storage stores all files from `state.files`, without blobs (the actual data of the file), and restores this meta information on boot.
- Service Worker stores references to all file blobs in memory. This should persist when navigating away from a page or closing browser tab, but will get destroyed after a browser crash / quit.
- IndexedDB stores all files that can be reasonably stored there, 10 MB per file, 300 MB in total. This lives until the browser or Uppy decide to do a cleanup.

Now when Uppy starts, we restore all meta information from Local Storage to get an idea of what was going on. For the blobs, we try to recover from both the Service Worker and IndexedDB. This goes a long way into supporting many disastrous cases out there. 

In some cases of cases (very big files and a complete browser crash), we won't be able to recover the file, but we do have information on it like the name & preview. 

Our current idea on that is that we could present the user with 'ghost files' and ask them to re-add these files. Here's a mockup, but we'd love more feedback on this:

<center>
  <img class="border" src="/images/blog/golden-retriever/desktop-ghost.png" alt="Design mockup with ghosts" title="Design mockup with ghosts">
</center>

For the remaining cases, if an upload was already in progress before the crash/refresh, and especially if it was resumable (via [tus](https://tus.io) for example), Golden Retriever just picks up from where it all went south. The Golden Retriever also cleans up after herself: when files are successfully uploaded, or you delete them, they are removed from all “permanent” storages.

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
