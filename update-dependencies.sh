npm update @userdashboard/maxmind-geoip || exit 1
npm update stripe || exit 1
npm shrinkwrap --dev || exit 1
git add npm-shrinkwrap.json || exit 1
git add package.json || exit 1
git commit -m "Updated dependencies" || exit 1
git push origin master || exit 1
