rem Copy target files
pushd %~dp0
xcopy ..\..\..\JavaScriptSDK\min targets /y
xcopy ..\..\..\JavaScriptSDK\*.* targets /y
xcopy ..\..\..\Node\*.* targets /y
xcopy ..\..\..\Node\Context\*.* targets /y

rem Run Policheck
"%programfiles(x86)%\MS\PoliCheck\MS.BGIT.Policheck.exe" /task:task.xml
popd
