---
title: Uppy: let’s teach an old dog some new tricks
date: 2016-06-28
author: arturi
---

## Uppy: let’s teach an old dog some new tricks

For the past six months, we have been working hard on uppy.io. We feel that it is high time we gave you a look behind the scenes: what are we working on, and why.

The way uploading works has not changed in a meaningful way since the days of our trusty old 56 kbit/s modems. Of course, files have gotten bigger and speeds have increased, but that is more or less all there is to say. If it were up to us – and we hope it is – that is all about to change.

We at [Transloadit](https://transloadit.com/) are on a mission to change the way the world does uploading. To accomplish this, our first step has been to develop an open protocol for resumable file uploads, called [‘tus’](http://tus.io/). Finally, that 2GB video upload from your smartphone doesn’t have to start over when your train passes through a tunnel! The protocol got [Hacker News excited](https://news.ycombinator.com/item?id=10591348) on several occasions and is being deployed by, among others, our friends at Vimeo. Now that a stable version 1.0 of ‘tus’ has been released, it is time to put it to the test. A protocol without real-world applications is nothing more than a meaningless document, after all.

We are therefore excited to tell you about Uppy: the file uploader that will certainly fetch more than just your newspaper. 

### Why the need for another file uploader?

It is true, there are indeed already a good few file uploading solutions out there ([Dropzone](http://www.dropzonejs.com/), for instance, is quite good). And – for the most part – they do their job. Nevertheless, they are quite limited in their functionality:

* You can drag and drop files from local disk, but uploaders that supports Instagram, Dropbox or Google Drive are scarce. The ones out there lock you in with vendors and are hard to customize for own use.

* File uploaders are seldom mindful of the existence of encoding and processing backends, while the reality is that files often require some form of processing and that the end user would like to receive progress updates with regard to that.

* None of the currently available file uploaders make use of the standardized resumability that ‘tus’ provides, which makes them less than ideal for handling larger files.

* Lastly, we feel that the current solutions are sometimes dropping the ball when it comes to a polished user experience. We aim to fix that.

All in all, we think there is definitely some ‘trouble at the old mill’ here and it’s time to let Uppy take care of that!

### Our plans for Uppy

Uppy will be a JavaScript file uploader that allows you to fetch files, not only from your local disk, but also from places like Dropbox, Instagram, Google Drive, webcams and remote URLs. It will have a modular, plugin-based design, making it lightweight and customizable.
Cute on the outside, the core of Uppy is very robust – thanks to resumability through 'tus'. We are confident that Uppy will be able to send even the biggest of files over the smallest of tubes. 
Uppy will also offer first class support for accessing Transloadit’s uploading and encoding backend, making it incredibly versatile. Of course, these are all ultimately just plugins, and Uppy can just as easily be used with your own backend – meaning no need to pay any subscription fees.

We are intent on making the user experience as smooth and satisfying as possible, in terms of both functionality and visual design. Uppy will have a beautiful, themeable UI and it will look – and work – great on mobile platforms as well. While we hope that advanced users will love the customizable nature of Uppy, an ample selection of presets will also be there to make sure that novice users are not going to be lost in the woods.

Lastly, and this is a point of special significance to us, Uppy will be completely open source. When Uppy is finished, you will be free to use it for whatever you like. Until that time, we very much welcome your ideas and contributions. There are still a lot of decisions to be made and this is the perfect time to come and influence the end product. 

We are going to work hard on bringing you the best file uploader possible and we’ll keep you informed about the development process on [uppy.io](http://uppy.io/). We can’t wait for you to meet Uppy!
