#!/bin/bash

# removes tags that Lerna generated, but then failed to release, 
# and is now unfortunately stuck
# usage: ./remove-tags.sh VERSION_NUMBER
# where VERSION_NUMBER is something like 0.30.0

Packages=(aws-s3 file-input react transloadit aws-s3-multipart form redux-dev-tools tus companion golden-retriever robodog url companion-client google-drive server-utils utils core informer status-bar webcam dashboard instagram store-default xhr-upload drag-drop progress-bar store-redux dropbox provider-views thumbnail-generator)
Version = $*

for i in "${Packages[@]}"
do
  TAG="@uppy/$i@$1"
  echo "removing $TAG"
  git tag -d $TAG
done
