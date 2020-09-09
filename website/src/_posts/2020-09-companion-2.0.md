---
title: "Companion 2.0 is here"
date: 2020-09-09
author: ife
published: true
---

We are happy to announce version 2.0 of Companion! 🎉 After maintaining and improving the 1.x series for over a year, we're now releasing a major version bump on the Companion package. The drive on this release is mainly towards fixing some terminology inconsistencies and aligning with Node.js LTS to ease the maintenance burden.

So what are the changes you can expect with Companion 2.0?

## Node >= v10

Node.js 8.x has reached end-of-life. Consequently, Companion 2.0 has dropped support for Node.js 6.x and Node.js 8.x, and now requires that you run at least Node.js 10.20.1.

## Renamed provider options

Pre 2.0, there were inconsistencies in relation to the provider names. In some places, the Google Drive provider was referred to as *google* (e.g., in `providerOptions`) while in some other places, it was referred to as *drive* (e.g., the server endpoints `/drive/list`). Companion 2.0 now consistently uses the name *drive* everywhere. Similarly, the OneDrive provider was made to have the consistent name *onedrive*.

## Changed Redirect URIs

On the topic of consistent naming, we have also made some changes to the redirect URIs supplied during the OAuth process. For example, in the case of Google Drive, the form of the old redirect URI was `https://mycompanionwebsite.tld/connect/google/callback`. In Companion 2.0, this is now changed to `https://mycompanionwebsite.tld/drive/redirect`. This is a Breaking Change: you will need to make the corresponding changes to your redirect URIs on your Providers' API Dashboards.

## Compatibility with Uppy 1.x client

Companion 2.0 is compatible with any Uppy 1.x version, so you don't have to worry about upgrading your Uppy client installations when you upgrade Companion on your server.

## Will Companion v1 still receive updates?

Companion 1.x will continue to receive security patches until March 1, 2021.

## Migrating from Companion 1.x to 2.x

Given the breaking changes, we've created a [migration tutorial for upgrading from Companion v1 to v2](https://uppy.io/docs/companion/#Migrating-v1-to-v2).
