REM rd /s /q node_modules
REM del package-lock.json

REM echo "starting build"
REM npm install 
REM rd /s /q amd\bundle
REM call grunt aiskulite && echo "copy files"
xcopy "node_modules/applicationinsights-channel-js/bundle" "bundle" /S /E /I
xcopy "node_modules/applicationinsights-common/bundle" "bundle" /S /E /I
xcopy "node_modules/applicationinsights-core-js/bundle" "bundle" /S /E  /I

