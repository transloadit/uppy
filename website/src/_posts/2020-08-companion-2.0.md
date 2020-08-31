---
title: "Companion 2.0 is here"
date: 2020-08-20
author: ife
published: false
---

Companion 2.0 is here! 🎉 After maintaining and improving the 1.x series for over a year, we're releasing a Major version bump on the Companion package. Why you ask? Well, the drive on this release is mainly towards fixing some terminology inconsistencies and aligning with Node.js LTS to ease the maintenance burden.

So what are the changes you'd expect to see on Companion 2.0?

## Node >= v10

Node.js 8.x has reached End-of-life, and in turn Companion 2.0 drops support for Node.js 6.x, Node.js 8.x and now requires that you run at least Node.js 10.20.1.

## Renamed Provider Options

Pre 2.0 there were inconsistencies in relation to the Provider names. In some places, the Google Drive provider was referred to as *google* (e.g in `providerOptions`) and in some other places, it was referred to as *drive* (e.g the server endpoints `/drive/list`). In Companion 2.0 it is now made to have the consistent name *drive* everywhere. Similarly the OneDrive provider is made to have the consistent name *onedrive* for the same reason.

## Changed Redirect URIs

Still on consistent naming, we have made some changes to the redirect URIs supplied during the OAuth process. For example, for Google Drive, the old redirect URI was of the form `https://mycompanionwebsite.tld/connect/google/callback`. In Companion 2.0, this is now changed to `https://mycompanionwebsite.tld/drive/redirect`. This is a Breaking Change and it means you would need to make these corresponding changes to your redirect URIs on your Providers' API Dashboards.

## Compatibility with Uppy 1.x client

Companion 2.0 is compatible with any Uppy 1.x version, so you don't have to worry about upgrading your Uppy client installations when you upgrade Companion on your server.

## Migrating from Companion 1.x to 2.x

Given the breaking changes, we've created a [migration tutorial for upgrading from Companion v1 to v2](https://uppy.io/docs/companion/#Migrating-v1-to-v2).
