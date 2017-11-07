CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "master" ]; then
  echo "Skipping step: not in master branch"
  exit 0
fi

VERSION_LENGTH=${#CIRCLE_BUILD_NUM}

if [ "$VERSION_LENGTH" -eq 1 ]; then
  NEW_VERSION=0.0.$(echo $CIRCLE_BUILD_NUM | cut -c1-1)
elif [ "$VERSION_LENGTH" -eq 2 ]; then
  NEW_VERSION=0.$(echo $CIRCLE_BUILD_NUM | cut -c1-1).$(echo $CIRCLE_BUILD_NUM | cut -c2-2)
elif [ "$VERSION_LENGTH" -ge 3 ]; then
  NEW_VERSION=$(echo $CIRCLE_BUILD_NUM | cut -c1-1).$(echo $CIRCLE_BUILD_NUM | cut -c2-2).$(echo $CIRCLE_BUILD_NUM | cut -c3-3)
fi

echo $NEW_VERSION | yarn version --no-git-tag-version

npm adduser <<!
$NPM_USER
$NPM_PWD
$NPM_EMAIL
!

npm publish ./
git tag -a v$NEW_VERSION -m "$(git log --pretty=format:'%h : %an : %ae : %s' -1)"
git push --tags