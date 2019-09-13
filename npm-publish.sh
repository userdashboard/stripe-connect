VERSION=`npm version patch` || exit 1
bash test.sh > tests.txt || exit 1
FAST_START=true NODE_ENV=sitemap node main.js || exit 1
git add . || exit 1
git commit -m "Version $VERSION " || exit 1
git push origin master || exit 1
npm publish || exit 1