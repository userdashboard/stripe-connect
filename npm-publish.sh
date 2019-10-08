LATEST=`npm info | grep latest`
LATEST="${LATEST/latest/}"
LATEST="${LATEST/: /}"
PACKAGE=`cat package.json | grep version`
PACKAGE="${PACKAGE/\"version\": \"/}"
PACKAGE="${PACKAGE/\",/}"
PACKAGE="${PACKAGE/  /}"
if [ "$LATEST" = "$PACKAGE" ]; then
  VERSION=`npm version patch` || exit 1
else
  VERSION=$PACKAGE
fi
bash test.sh > tests.txt || exit 1
FAST_START=true NODE_ENV=sitemap node main.js || exit 1
git add . || exit 1
git commit -m "Version $VERSION " || exit 1
git push origin master || exit 1
npm publish || exit 1