@echo off
setlocal enabledelayedexpansion

rem Point tweego at the vendored SugarCube release so builds don't depend on a system install
set TWEEGO_PATH=devTools\tweego\storyFormats

if defined FORCE_VERSION (
	set "VERSION=%FORCE_VERSION%"
) else (
	for /f "delims=" %%v in ('git describe --tags --always --dirty 2^>nul') do set "VERSION=%%v"
	if not defined VERSION (
		if exist version set /p VERSION=<version
	)
)

rem Empty FORCE_VERSION (as set by the dev server) must produce the stable filename.
if "!VERSION!"=="" (
	set "TARGET=Degrees of Deepspace.html"
) else (
	set "TARGET=Degrees of Deepspace !VERSION!.html"
)

set "TWEEGO_EXE="
where tweego >nul 2>nul && set "TWEEGO_EXE=tweego"

if not defined TWEEGO_EXE (
	if "%PROCESSOR_ARCHITECTURE%"=="x86" (
		set "TWEEGO_EXE=devTools\tweego\tweego_win86.exe"
	) else (
		set "TWEEGO_EXE=devTools\tweego\tweego_win64.exe"
	)
)

if not "%TWEEGO_EXE%"=="tweego" (
	if not exist "%TWEEGO_EXE%" (
		echo No tweego binary found on PATH, and no vendored binary available.
		echo Run "npm run build" or "npm run dev" once — they download Tweego automatically.
		echo Or install from http://www.motoslave.net/tweego/ — see devTools\tweego\README.md.
		exit /b 2
	)
)

rem The story format comes from StoryData; see the matching comment in compile.sh.
"%TWEEGO_EXE%" %* -o "!TARGET!" --head "devTools\head.html" --module "modules" game\
if errorlevel 1 (
	echo Build failed.
	exit /b 1
)

if not "!TARGET!"=="Degrees of Deepspace.html" (
	copy /Y "!TARGET!" "Degrees of Deepspace.html" >nul
)

echo Done: "!TARGET!"
exit /b 0
