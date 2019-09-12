@echo off
@setlocal enabledelayedexpansion enableextensions

set BuildRoot=%~dp0..\..\bin\debug\

for /F %%F in ('dir "..\..\bin\*tests*.dll" /s /b 2^> nul') do set TESTS=!TESTS! %%F
set TESTS=%TESTS:~1%

vstest.console /UseVsixExtensions:true %TESTS%