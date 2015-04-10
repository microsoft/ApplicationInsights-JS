setlocal

rem SKIP TESTS BY UNCOMMENTING THE FOLLOWING LINE
goto TheEnd


rem Run Windows Phone tests that are not currently supported by TeamBuild
set VSTEST_CONSOLE="C:\Program Files (x86)\Microsoft Visual Studio 12.0\Common7\IDE\CommonExtensions\Microsoft\TestWindow\vstest.console.exe"
set TESTRESULT=0

%VSTEST_CONSOLE% %TF_BUILD_BINARIESDIRECTORY%\Release\Core\Managed.Tests\Wp80\Wp80.Tests_Release_x86.xap /logger:"TfsPublisher;collection=%TF_BUILD_COLLECTIONURI%;TeamProject=AppInsights;buildname=%TF_BUILD_BUILDNUMBER%;Platform=Mixed Platforms;Flavor=Release;RunTitle=Core.Wp80.Tests" /InIsolation
if %ERRORLEVEL% neq 0 set TESTRESULT=%ERRORLEVEL%

%VSTEST_CONSOLE% %TF_BUILD_BINARIESDIRECTORY%\Release\Platform\Platform.Tests\Platform.Wp80.Tests\x86\Wp80.Tests_Release_x86.xap /logger:"TfsPublisher;collection=%TF_BUILD_COLLECTIONURI%;TeamProject=AppInsights;buildname=%TF_BUILD_BUILDNUMBER%;Platform=Mixed Platforms;Flavor=Release;RunTitle=Platform.Wp80.Tests" /InIsolation
if %ERRORLEVEL% neq 0 set TESTRESULT=%ERRORLEVEL%

rem Kill the Windows Phone Emulator to prevent next build from failing due to file locking
taskkill /im xde.exe

rem Fail the build if any test runs failed
if %TESTRESULT% neq 0 exit /B %TESTRESULT%

:TheEnd

REM Push the nupkg files to our private NuGet repository
call PushNugetPackages.cmd