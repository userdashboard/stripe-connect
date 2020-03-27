if [ "$1" == "version" ]; then
  VERSION=`npm version patch` || exit 1
else
  PACKAGE=`cat package.json | grep version`
  PACKAGE="${PACKAGE/\"version\": \"/}"
  PACKAGE="${PACKAGE/\",/}"
  PACKAGE="${PACKAGE/  /}"
fi
bash test.sh > tests.txt || exit 1
FAST_START=true EXIT_ON_START=true NODE_ENV=sitemap bash start-dev.sh || exit 1
git add . || exit 1
git commit -m "Version $VERSION " || exit 1
git push origin master || exit 1
npm publish || exit 1