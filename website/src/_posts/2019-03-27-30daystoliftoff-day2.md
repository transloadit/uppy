---
title: "Day 2"
date: 2019-03-27
author: samuel
image: "https://uppy.io/images/blog/0.30/robodog-assemble.jpg"
published: false
series: 30 Days to Liftoff
seriesSuffix: 'of 30'
---

Howdy partners!, yesterday, we started a 30 days liftoff toward releasing [Uppy](https://uppy.io) V1.0, and we also introduced a new addition to the team in the person of [Evgenia Karunus](https://github.com/lakesare). Today marks the second day in the development cycle, and we have quite a lot of work going on already. 

<!--more-->

First off, [Renée](https://github.com/goto-bus-stop) kickstarted the whole process when he took a leap towards fixing outdated `ffmpeg_stack` warnings in our examples. 

[Evgenia Karunus](https://github.com/lakesare) also submitted her first 2 PRs, and also closed the accompanying tasks. What a way to blend into the team. The PR's she opened aimed at making the tooltip not overflow the [Uppy](https://uppy.io) container and also remove jumpiness when Uppy](https://uppy.io) loads. The PR's can be found [here](https://github.com/transloadit/uppy/pull/1382) and [here](https://github.com/transloadit/uppy/pull/1383) respectively.

## The Roadmap to 1.0

We made an Asana project for [Uppy](https://uppy.io), in which we have assigned a lot of cards to the completion of 1.0. Currently, we have our cards divided into 5 sections, which are: `new`, `nice to have`, `todo`, `in progress` and `done`. The tasks in the `todo`, `in progress ` and `done` lanes are the ones that are guaranteed to make the 1.0 release. If we have time on our side before the launch date, we will also be sure to take on the nice to have tasks. As for the new tasks, might be seeing them as upgrades after the initial 1.0 big release. Here is a screenshot of what our board looks like:

<center><img src="/images/blog/30daystoliftoff/2019-03-27-board02.png"></center>

Currently, we have three items on our done lane, which means we are progressing to the launch of 1.0 on the 25th of April. However, should be noted that while the pace might look slow for now, starting April 1, it's full steam ahead on these issues. Before then, we're also planning a lot and busting open issue. So let's cut the engineers some slack.


## What Pull Request was accepted?

Part of the big release that's going to happen in 1.0 is bug fixes. 

[Arthur](https://github.com/arturi) opened the floor by merging a pull request. To be specific, this [pull request](https://github.com/transloadit/uppy/pull/1375) which aims to use <dfn>Templates</dfn> and demo key for `transloadit-textarea` examples opened by [Renée](https://github.com/goto-bus-stop). Still, on [Arthur](https://github.com/arturi), he proceeded with this [pull request](https://github.com/transloadit/uppy/pull/1374) which aimed at removing a hardcoded variable which was also opened by [Renée](https://github.com/goto-bus-stop)

[Ife](https://github.com/ifedapoolarewaju) picked up from where [Arthur](https://github.com/arturi) stopped, reviewed and merged this [pull request](https://github.com/transloadit/uppy/pull/1366) which updated the callback URIs to reflect their correct location in companion thanks to [HughbertD](https://github.com/HughbertD).

## What is the team working on today?

Currently, the team is working on a companion issue, where we have to deal with invalid access tokens when you select a provider to get your file from. The aim is to return 401 for invalid access token so that the `/authorized` endpoint can be deprecated. You can track the process of the current work as we move ahead with it. Currently, [Ife](https://github.com/ifedapoolarewaju) has opened a pull request to that effect, which can be found [here](https://github.com/transloadit/uppy/pull/1298).

A big update coming to 1.0 is the React Native support. As it stands, a call which will shapen the process has been scheduled for later today. As you might have figured, [Evgenia Karunus](https://github.com/lakesare) is a React expert, and will be joining the call today. React Native lovers, it's time for you to shine. [Uppy](https://uppy.io) is here for you.


Friendly reminder that we can use your help! You can be part of the reason why 1.0 becomes a huge success. As we've said, we're looking to spread the word so any retweet, blog post, star, you name it, is gonna be double extra appreciated. Also, [issue busting](https://github.com/transloadit/uppy/issues) is going to slow down as we're about to head deep into the remaining design goals (e.g. React Native). So, if you want to lend a hand with that, we'd owe you big time!

That's it, all the updates I have on the ground. More updates coming your way tomorrow, as we approach day 3 of our 30 Days to Liftoff!

