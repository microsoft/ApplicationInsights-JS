echo ON
echo %1
if "%1" EQU "" (
   echo "Usage: build amd|cjs"
   echo "Please use amd or cjs as input"
  goto END
)

rd /s /q node_modules
del package-lock.json

echo "starting build"
xcopy %1\package.json . /Y /S
call npm install 
rd /s /q amd\bundle
call grunt aisku && echo "copy files"
xcopy "node_modules/applicationinsights-analytics-js/bundle" "amd/bundle" /S

xcopy "node_modules/applicationinsights-channel-js/bundle" "amd/bundle" /S

xcopy "node_modules/applicationinsights-common/bundle" "amd/bundle" /S
xcopy "node_modules/applicationinsights-core-js/bundle" "amd/bundle" /S
xcopy "node_modules/applicationinsights-dependencies-js/bundle" "amd/bundle" /S
xcopy "node_modules/applicationinsights-properties-js/bundle" "amd/bundle" /S

call npx webpack --config webpack.production.config.js

call npx webpack --config webpack-dev.config.js

:END
echo "Exiting script"