#!/usr/bin/env bash

output=/dev/stdout

#display an error message
function echoError() {
	echo -e "\033[0;31m$*\033[0m"
}

#display message
function echoMessage() {
	echo "$1" >"${output}"
}

#resolve the version string used in the output filename
function resolveVersion() {
	if [ -n "${FORCE_VERSION+true}" ]; then
		echo "$FORCE_VERSION"
		return
	fi
	if git rev-parse --git-dir >/dev/null 2>&1; then
		DESCRIBED="$(git describe --tags --always --dirty 2>/dev/null)"
		if [ -n "$DESCRIBED" ]; then
			echo "$DESCRIBED"
			return
		fi
	fi
	# Fresh clone with no commits yet: fall back to the tracked version file
	if [ -f version ]; then
		tr -d '[:space:]' <version
	fi
}

#locate a tweego binary, preferring one on PATH
function resolveTweego() {
	if command -v tweego >/dev/null 2>&1; then
		echo "tweego"
		return
	fi

	case "$(uname -m)" in
		arm64 | aarch64)
			echoMessage "arm64 arch"
			if [ "$(uname -s)" = "Darwin" ]; then
				echo "./devTools/tweego/tweego_osx64"
			else
				echo "./devTools/tweego/tweego_linux64"
			fi
			;;
		x86_64 | amd64)
			echoMessage "x64 arch"
			if [ "$(uname -s)" = "Darwin" ]; then
				echo "./devTools/tweego/tweego_osx64"
			elif [ "$OSTYPE" = "msys" ]; then
				echo "./devTools/tweego/tweego_win64.exe"
			else
				echo "./devTools/tweego/tweego_linux64"
			fi
			;;
		x86 | i[3-6]86)
			echoMessage "x86 arch"
			if [ "$(uname -s)" = "Darwin" ]; then
				echo "./devTools/tweego/tweego_osx86"
			elif [ "$OSTYPE" = "msys" ]; then
				echo "./devTools/tweego/tweego_win86.exe"
			else
				echo "./devTools/tweego/tweego_linux86"
			fi
			;;
		*)
			echo ""
			;;
	esac
}

function compile() {
	# Point tweego at the vendored SugarCube release so builds don't depend on a system install
	export TWEEGO_PATH=devTools/tweego/storyFormats

	VERSION="$(resolveVersion)"
	if [ -z "${VERSION}" ]; then
		TARGET="Degrees of Deepspace.html"
	else
		TARGET="Degrees of Deepspace $VERSION.html"
	fi

	TWEEGO_EXE="$(resolveTweego)"
	if [ -z "$TWEEGO_EXE" ] || { [ "$TWEEGO_EXE" != "tweego" ] && [ ! -x "$TWEEGO_EXE" ]; }; then
		echoError "No tweego binary found on PATH, and no vendored binary available for your platform."
		echoError "Install tweego from http://www.motoslave.net/tweego/ or see devTools/tweego/README.md."
		exit 2
	fi

	# No -f flag: tweego resolves the story format from the "format" and "format-version" fields in
	# StoryData, matching them against the vendored format.js. Upgrading SugarCube is therefore a
	# two-line change — drop in the new format.js and bump format-version in game/01-config/start.twee.
	$TWEEGO_EXE "$@" -o "$TARGET" --head "devTools/head.html" --module "modules" game/ || build_failed="true"

	if [ "$build_failed" = "true" ]; then
		echoError "Build failed."
		exit 1
	fi

	if [ "$TARGET" != "Degrees of Deepspace.html" ]; then
		# Stable filename for the dev server and for bookmarks. Symlink, not a copy.
		ln -fs "$TARGET" "Degrees of Deepspace.html"
	fi
	echo "Done: \"$TARGET\""
	exit 0
}

compile "$@"
