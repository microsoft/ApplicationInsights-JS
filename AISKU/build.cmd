rd /s /q node_modules
del package-lock.json
rd /s /q amd\bundle
echo "starting build"
grunt aisku

xcopy "node_modules/applicationinsights-analytics-js/bundle" "amd/bundle" /S /I
xcopy "node_modules/applicationinsights-channel-js/bundle" "amd/bundle" /S /I
xcopy "node_modules/applicationinsights-common/bundle" "amd/bundle" /S /I
xcopy "node_modules/applicationinsights-core-js/bundle" "amd/bundle" /S /I
xcopy "node_modules/applicationinsights-dependencies-js/bundle" "amd/bundle" /S /I
xcopy "node_modules/applicationinsights-properties-js/bundle" "amd/bundle" /S /I

