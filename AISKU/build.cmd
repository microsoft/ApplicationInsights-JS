echo OFF
echo %1

if "%1" EQU "" (
   echo "Usage: build <path to channel repo>"
  goto END
)

pushd .

for %%i in (%1, "..\AppInsightsCommon", "..\extensions\applicationinsights-properties-js", "..\extensions\applicationinsights-dependencies-js", "..\ApplicationInsights", "..\AISKU") do (
    echo "Change directory to %%i"
    cd %%i
    echo "Cleaning up node_modules directory"
    rd /s /q node_modules
    echo "Deleting package-lock.json"
    del package-lock.json

    echo Installing packages>> npm i
    call npm i
    IF %ERRORLEVEL% NEQ 0 (
        goto :ERRORFOUND
    )

    echo "Building>> npm run build --silent"
    call npm run build --silent
    IF %ERRORLEVEL% NEQ 0 (
        goto :ERRORFOUND
    )

    echo "Packing>> npm pack"
    call npm pack
    IF %ERRORLEVEL% NEQ 0 (
        goto :ERRORFOUND
    )

    popd
    echo "Current directory"
    call cd
    echo "Push current directory"
    pushd .
)
 echo "Completed all builds successfully"
 exit /B %ERRORLEVEL%

:ERRORFOUND
 echo "Failed to build"
 exit /B %ERRORLEVEL%

 :END
 echo "Please see usage"
 exit /B %ERRORLEVEL%