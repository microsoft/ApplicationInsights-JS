rem This script is called by the CI build after each test run.

rem Kill all remaining IIS Express at the end of the test run.
rem This is a workaround for it locking the build directory and breaking the subsequent build.
tasklist /FI "IMAGENAME eq iisexpress*" | find /I /N "iisexpress"
if "%ERRORLEVEL%"=="0" taskkill /im iisexpress*

rem Push the nupkg file to our private NuGet repository
call %TF_BUILD_SOURCESDIRECTORY%\scripts\PushNugetPackages.cmd