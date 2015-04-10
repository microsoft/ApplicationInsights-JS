setlocal

set BINROOT=%TF_BUILD_BINARIESDIRECTORY%\Release
if not exist %BINROOT% echo "Error: '%BINROOT%' does not exist."&goto :eof

set NUGET=%TF_BUILD_SOURCESDIRECTORY%\.nuget\NuGet.exe
if not exist %NUGET% echo "Error: '%NUGET%' does not exist."&goto :eof

set NUGET_GALLERY=https://ms-nuget.cloudapp.net/

for /r "%BINROOT%" %%P in (*.nupkg) do call :push %%P
goto :eof

:push 
set PACKAGE=%1
if %PACKAGE:.symbols.=% == %PACKAGE% (
    %NUGET% push "%PACKAGE%" -source %NUGET_GALLERY%
)
goto :eof

endlocal
