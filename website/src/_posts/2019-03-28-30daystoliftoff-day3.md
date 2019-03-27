---
title: "Day 3"
date: 2019-03-28
author: samuel
image: "https://uppy.io/images/blog/30daystoliftoff/inspace2.jpg"
series: 30 Days to Liftoff
seriesSuffix: 'of 30'
---

Two days ago we started our thirty-day blog post challenge to keep you updated on **releasing Uppy 1.0 on April 25**. Here's day three for you!
 
<!--more-->

Our big coding speedrun towards for 1.0 starts April 1, so are are mostly busy with tying up lose ends, busting issues, and planning out our work.

## What have we checked off our *To Do* list?

Today marks the third day of our launch preparations, and we have quite a lot going on. 

[Artur](https://github.com/arturi) started out by merging two pull requests from [Renée](https://github.com/goto-bus-stop). The [first](https://github.com/transloadit/uppy/pull/1375) one aims to use Transloadit Templates and demo keys for the `transloadit-textarea` example, and the [second](https://github.com/transloadit/uppy/pull/1374) one makes error reporting across different languages more flexible.

[Ife](https://github.com/ifedapoolarewaju) then reviewed and merged this [pull request](https://github.com/transloadit/uppy/pull/1366), which updates the callback URIs to reflect their correct location in Companion. Thanks to [HughbertD](https://github.com/HughbertD) for that one!

## What is the team working on today?

Renée is working hard to fix outdated `ffmpeg_stack` warnings in our examples. Other than that, the team has been working on a Companion issue that invalid access tokens are given out when you select a provider to receive your file from. The aim is to return 401 for invalid access tokens, so that the `/authorized` endpoint can be deprecated. You can track the progress of this issue in its [pull request](https://github.com/transloadit/uppy/pull/1298).

The biggest update that will be part of Uppy 1.0 is support for React Native. Today, Renée, Artur, Ife, [Evgenia](https://github.com/lakesare) and [Kevin](https://github.com/kvz) had a call about it and talked extensively about what we need for an MVP. The were kind enough to share their notes that i'll happy extend to you as-is :)

- get a link provider example to work, including showing companion progress, and resumability
- it gets its own UI, (re)written for RN
- make websocket progress from Companion work (see: https://facebook.github.io/react-native/docs/network#websocket-support)
- resumability support within 20min (easily tested by disabling wifi on your workstation while uploading to master.tus.io)
- the example gets buttons for resumability & a progress bar
- the example gets file previews (likely uppy RN itself does not offer previews)

We also celebrated Evgenia also submitting her first two PRs: [one](https://github.com/transloadit/uppy/pull/1382) to make sure that tooltips can no longer overflow inside the Uppy container, and [another](https://github.com/transloadit/uppy/pull/1383) that removes the jumpiness when Uppy loads.

That's all the updates I have for you today. See you tomorrow for day 4 of our 30 Days to Liftoff!

