REM rd /s /q node_modules
REM del package-lock.json

REM echo "starting build"
REM npm install 
rd /s /q amd\bundle
call grunt aisku && echo "copy files"
xcopy "node_modules/applicationinsights-analytics-js/bundle" "amd/bundle" /S

xcopy "node_modules/applicationinsights-channel-js/bundle" "amd/bundle" /S

xcopy "node_modules/applicationinsights-common/bundle" "amd/bundle" /S
xcopy "node_modules/applicationinsights-core-js/bundle" "amd/bundle" /S
xcopy "node_modules/applicationinsights-dependencies-js/bundle" "amd/bundle" /S
xcopy "node_modules/applicationinsights-properties-js/bundle" "amd/bundle" /S

