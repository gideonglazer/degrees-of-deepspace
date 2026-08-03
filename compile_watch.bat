@echo off
rem Rebuild automatically whenever a source file under game/ or modules/ changes.
call "%~dp0compile.bat" -w %*
