CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "master" ]; then
  echo "Skipping step: not in master branch"
  exit 0
fi

VERSION_LENGTH=${#CIRCLE_BUILD_NUM}

NEW_VERSION=$(echo $CIRCLE_BUILD_NUM | cut -c1-1).0.0


echo $NEW_VERSION | yarn version --no-git-tag-version

npm adduser <<!
$NPM_USER
$NPM_PWD
$NPM_EMAIL
!

npm publish ./
git tag -a v$NEW_VERSION -m "$(git log --pretty=format:'%h : %an : %ae : %s' -1)"
git push --tags