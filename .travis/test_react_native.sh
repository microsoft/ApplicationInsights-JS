cd extensions/applicationinsights-react-native

echo -en 'travis_fold:end:change\\r'
echo 'Checking for inconsistent dependency versions' && echo -en 'travis_fold:start:check\\r'
node common/scripts/install-run-rush.js check

echo -en 'travis_fold:end:check\\r'
echo 'Installing...' && echo -en 'travis_fold:start:install\\r'
rm -rf common/temp/npm-local
node common/scripts/install-run-rush.js install

npm install
npm run build
npm run test
npm run lint
