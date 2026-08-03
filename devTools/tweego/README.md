# Tweego

`compile.sh` / `compile.bat` look for a Tweego binary in this order:

1. `tweego` on your `PATH`
2. A platform-specific binary vendored in this directory

Vendoring the binaries lets contributors build without installing anything, which is how upstream
Degrees of Lewdity ships. They are not committed here because they are large and platform-specific.
To vendor them, download the archives from <http://www.motoslave.net/tweego/> and place the
executables here using these exact names:

| Platform             | Filename           |
| -------------------- | ------------------ |
| macOS x64 / universal | `tweego_osx64`     |
| macOS x86            | `tweego_osx86`     |
| Linux x64            | `tweego_linux64`   |
| Linux x86            | `tweego_linux86`   |
| Windows x64          | `tweego_win64.exe` |
| Windows x86          | `tweego_win86.exe` |

Remember to `chmod +x` the Unix binaries.

## storyFormats

`storyFormats/sugarcube-2/` holds the SugarCube 2 story format Tweego compiles against — currently
**2.37.3**. The build points `TWEEGO_PATH` here, so the vendored copy is always used regardless of what
is installed system-wide.

This is the **Twine 2** packaging (`format.js`), not the Twine 1.4 one (`header.html` +
`sugarcube-2.py`). That matters: `format.js` declares its own name and version, which is what lets
Tweego resolve the format from the `format`/`format-version` fields in `StoryData`. The Twine 1.4
packaging carries no version metadata, so it can only be selected with an explicit `-f` flag.

To upgrade, download the `sugarcube-*-for-twine-2.1-local.zip` asset from
<https://github.com/tmedwards/sugarcube-2/releases>, replace this directory with the `sugarcube-2`
folder inside it, and bump `format-version` in `game/01-config/start.twee` to match.
