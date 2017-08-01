---
title: "The Golden Retriever: Making uploads survive browser crashes"
date: 2017-07-31
author: arturi
image: "http://uppy.io/images/blog/golden-retriever/uppy-team-kong.jpg"
published: true
---

Don’t you just hate it when you’re about to share the perfect photos from your trip to Iceland, and halfway through, your cat jumps on the keyboard and trashes your browser? Or the battery in your laptop dies? Or you accidentally close the tab or navigate away? We hate that too!

If action games have had checkpoints since 1687 — why can’t file uploaders? Well, as it turns out, they can! We found a way to get those Iceland pics into the hands of your loved ones with near-zero levels of frustration, even after a dreaded Blue Screen of Death! (if that is still a thing ;)

First off, let’s show you a demo 📹 of Uppy surviving a browser crash and picking up right where we left it:

<figure class="wide"><video alt="Demo video showing the Golden Retriever file restoring plugin in action" controls><source src="/images/blog/golden-retriever/uppy-golden-retriever-crash-demo-2.mp4" type="video/mp4">Your browser does not support the video tag, you can <a href="/images/blog/golden-retriever/uppy-golden-retriever-crash-demo-2.mp4">download the video</a> to watch it.</video></figure>

<!-- more -->

## Uppy?

For those of you who are new here, Uppy is the next-gen open source file uploader for the web. It is made by Transloadit and thus it works great with their uploading & encoding platform — but it also works great without! Simply add Uppy JavaScript to your website, deploy your own tusd/Node.js/Apache/Nginx server, and be on your way. Add [uppy-server](https://github.com/transloadit/uppy-server), and your users will be able to pick files from remote sources like Dropbox and Instagram. Uppy’s focus is on the modern web, and we go through extreme lengths to achieve the smoothest of user experiences, and the most durable of reliabilities. 🙃

## Hacking trip

Our core team is spread across three continents and five cities, and most of us have never met in person, with the majority of communication happening in GitHub and Slack. Just last week, we got together in Berlin for a crazy week of pink limo rides, Indian food and Mario Kart 64. More on that coming soon on the [Transloadit blog](https://transloadit.com/blog/).

<figure class="wide"><img src="/images/blog/golden-retriever/uppy-team-kong.jpg"></figure>

While enjoying some world-famous-in-Germany “Flammkuchen”, we were thinking about even more ways to make file uploading better (yes, we really can’t stop thinking about that). We then sat together in one room for a few days of hacking and came up with something neat. 

## The Golden Retriever

Uppy has a new friend to play with. Meet the Golden Retriever, our file recovery plugin:

<center><img src="/images/blog/golden-retriever/catch-fail-2.gif" alt="Golden Retriever failing to catch something" title="Good try, girl!"></center>

As you can see, we’re not yet fully done with training her, but we’re getting there! 😄

But wait, we can hear you think, didn't [tus.io](https://tus.io) already make resumable uploads possible? Yes indeed, and it does an awesome job at recovering from poor network conditions. However, if your browser suddenly decided to crash, Uppy would have no idea about what it was doing before, and you would have to re-select and edit your files all over. 

<center><img src="/images/blog/golden-retriever/no-idea-dog-3.gif" alt="Dog has no idea what he is doing" title="Keep trying, buddy!"></center>

For those cases, our Golden Retriever now comes to the rescue! It saves Uppy’s memory (state) in browser cache with every move you make. This means that when Uppy suddenly crashes for whatever reason, our plugin will be able to retrieve this memory upon restart, and offer to resume where you left off. Sounds simple enough right? So why hasn't anybody attempted this before?

As it turns out, it’s tricky. For one thing, no other competing file uploader uses tus, and resuming uploads without standardized and scrutinized components is really leaving you with more problems than you’re trying to solve in the first place. But with tus, we are standing on the shoulders of a giant and need not worry about the resumability aspect of the transmission.

So then it becomes all about remembering what was going on with file selection and uploading right before the crash. One of the big issues here is that because of security reasons, Uppy is no longer allowed to access the selected files on your disk after a crash. Reasonable of course, but this meant that we had to deploy a number of workarounds that — while it may cause our inner purist some upset - combined, now amount to a pretty sweet user experience for the majority of cases. And in the end, that is what Uppy is all about: pleasing and delighting its users.

## 👻 How it works

If you really want to know...

Because we cannot access the files that we were uploading from disk, we cache them inside the browser.

It all started with [a prototype](https://github.com/transloadit/uppy/issues/237) by [Richard Willars](https://github.com/richardwillars), which used a Service Worker to store files and states. Service Workers are great for when you close a tab, but when the browser dies, so does the Service Worker (in most cases). Also: iOS does not support it yet. So, we looked at Local Storage, which is almost universally available and _can_ survive a browser crash, but can't be used to store blobs. We also considered IndexedDB, which _can_ store blobs, but is less available and has severe limits on how much you can or should store in it.

Since all of these technologies came with specific drawbacks, which one should we pick?

Why, all of them, of course! By combining the three, they cover each other’s disadvantages with their own advantages. Here's what goes where: 

- Local Storage stores all files state, without blobs (the actual data of the file), and restores this meta information on boot.
- Service Worker stores references to all file blobs in memory. This should persist when navigating away from a page or closing the browser tab, but will likely get destroyed after a browser crash / quit.
- IndexedDB stores all files that can reasonably be stored there, up to 10 MB per file and 300 MB in total (we are still debating reasonable limits). This persists until either the browser or Uppy decides to do a cleanup.

Now when Uppy starts, we restore all meta information from Local Storage to get an idea of what was going on. For the blobs, we try to recover data from both the Service Worker and IndexedDB. This goes a long way into supporting many disastrous scenarios out there. 

In some cases (very large files or a complete browser crash), we won’t be able to recover the file, but we do have valuable information about it, such as the name and a preview.

Our current idea is that we could present the user with “ghost files” for these edge cases, and ask them to re-add such files. Here’s an early mockup, but we would love more feedback on this:

<img src="/images/blog/golden-retriever/desktop-ghost.png" alt="Design mockup with ghosts" title="Design mockup with ghosts">

For the remaining cases, if an upload was already in progress before the crash/refresh, and especially if it was resumable (via [tus](https://tus.io), for example), Golden Retriever just picks up from where it all went south. Our Golden Retriever will also clean up after herself: when files are successfully uploaded, or you decide to delete them, they will be removed from all “permanent” storages.

## 🚦 Give it a try in alpha

Golden Retriever already works — tail awagging — and feels like magic :sparkles:, but it is also unstable, and hasn’t been tested on all the different devices yet. We encourage you to try it out though:

```sh
git clone https://github.com/transloadit/uppy.git
git checkout feature/restore-files
npm install
npm run dev
```

A new browser tab with Uppy + Golden Retriever should open in a moment after the last command from above. The app entry point is in `examples/bundled-example/main.js`, it rebuilds on change. Enjoy! And please give your feedback in the [#268](https://github.com/transloadit/uppy/pull/268) PR 🎉

The Uppy Team