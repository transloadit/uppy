---
title: "Day 2"
date: 2019-03-27
author: samuel
image: "https://uppy.io/images/blog/0.30/robodog-assemble.jpg"
published: false
series: 30 Days to Liftoff
seriesSuffix: 'of 30'
---

What's Uppy today?

We were just about to tell you! Yesterday, marked the beginning of our thirty-day coding speedrun towards **releasing Uppy 1.0 on April 25**. We also promised you that we would be writing about this every day. So here we are again already! Today marks the second day of our launch preparations, and we have quite a lot going on. 

<!--more-->

## Our roadmap for 1.0

With so much still to do before Uppy 1.0 is ready go, it's important that we keep track of all the various tasks. We are doing this with help of an Uppy 1.0 project dashboard that we created in [Asana](https://asana.com). This lets us see in an instant what everyone is working on and what the current status is on specific tasks. 

We currently have our tasks divided into five sections, which are: `new`, `nice to have`, `todo`, `in progress` and `done`. The tasks in the `todo` and `in progress` lanes (and of course those that are `done`) are guaranteed to make the 1.0 release. And if we have time on our side before the launch date, we'll also try to get as many of the `nice to have` tasks checked off as well. As for the `new` tasks, you might be seeing those as upgrades at some point after the 1.0 release. 

We didn't manage to get all of those To Do's in the picture, but here is a screenshot of what our board looks like at the moment:

<center><img src="/images/blog/30daystoliftoff/2019-03-27-board02.png"></center>

## What have we checked off our ToDo list?

A big part of getting Uppy ready for 1.0 is fixing all of the bugs that still occur. [<-So, did anything in that department get removed from the to do list? Or are the things under here bug fixes?]

[Artur](https://github.com/arturi) started out by merging two pull requests from [Renée](https://github.com/goto-bus-stop). The [first](https://github.com/transloadit/uppy/pull/1375) one aims to use Transloadit Templates and demo keys for `transloadit-textarea` and the [second](https://github.com/transloadit/uppy/pull/1374) one removes a hardcoded variable.

[Ife](https://github.com/ifedapoolarewaju) then reviewed and merged this [pull request](https://github.com/transloadit/uppy/pull/1366), which updated the callback URIs to reflect their correct location in Companion. Thanks to [HughbertD](https://github.com/HughbertD) for that one!

## What is the team working on today?

[Renée](https://github.com/goto-bus-stop) is working hard to fix outdated `ffmpeg_stack` warnings in our examples. Other than that, the team is working on a Companion issue that invalid access tokens are given out when you select a provider to receive your file from. The aim is to return 401 for invalid access tokens, so that the `/authorized` endpoint can be deprecated. You can track the progress of this issue in its [pull request](https://github.com/transloadit/uppy/pull/1298).

A big update that will be part of 1.0 is React Native support for Uppy. Today, [Renée](https://github.com/goto-bus-stop), [Artur](https://github.com/arturi), [Ife](https://github.com/ifedapoolarewaju), [Evgenia](https://github.com/lakesare) and [Kevin](https://github.com/kvz) had a call about it to [insert what the call was about]. 

[Evgenia](https://github.com/lakesare) also submitted her first two PRs: [one](https://github.com/transloadit/uppy/pull/1382) to make sure that the tooltip no longer overflows the Uppy container, and [another](https://github.com/transloadit/uppy/pull/1383) that removes the jumpiness when Uppy loads.

That's all the updates I have for you today. See you tomorrow for day 3 of our 30 Days to Liftoff!

