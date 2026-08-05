/**
 * SugarCube engine configuration and the build's feature switches.
 *
 * Runs after game/00-framework-tools and before everything else in game/.
 */

/*
 * Build switches. Read these from content rather than hardcoding behaviour, so a text-only or debug
 * build is a one-line change here.
 *
 * - debug: enables debug tooling, for new games only.
 * - enableImages: set false to produce a text-only build.
 * - enableLinkNumberify: number passage links and allow 0–9 / numpad shortcuts.
 * - version: stored in saves so Versions can migrate them.
 * - versionName: optional label, e.g. "alpha". Empty string means no label.
 */
window.StartConfig = {
	debug: false,
	enableImages: true,
	enableLinkNumberify: true,
	version: "0.1.0",
	versionName: "",
};

StartConfig.versionNumeric = Versions.toNumeric(StartConfig.version);
DOD.version = StartConfig.version;

/* Engine ----------------------------------------------------------------- */

/*
 * History depth. One state means no undo, which is the usual choice for a sandbox where actions are
 * meant to be committed to; it also keeps saves small. Raise it if you want the back button to work.
 */
Config.history.maxStates = StartConfig.debug ? 10 : 1;
Config.history.controls = StartConfig.debug;

Config.saves.maxSlotSaves = 12;
Config.saves.maxAutoSaves = 1;
Config.saves.isAllowed = function (saveType) {
	// Passages tagged nosave are menus and intros: restoring into one would skip initialisation
	if (tags().includes("nosave")) return false;
	return saveType !== Save.Type.Auto || !tags().includes("noauto");
};

Config.macros.maxLoopIterations = 5000;

State.prng.init();

l10nStrings.errorTitle = `${StartConfig.version} Error`;

/*
 * Bring an older save up to date on load. The migrations themselves live in
 * game/00-framework-tools/02-version/versions.js.
 */
Save.onLoad.add(function (save) {
	// Errors carried over from a previous session should not look like a fresh problem
	Errors.hide(true);
	save.state.history.forEach(moment => Versions.update(moment.variables));
});

/* Runtime stylesheet ------------------------------------------------------ */

/*
 * style.css is fetched rather than compiled in, so it can be edited and picked up with a refresh
 * instead of a rebuild. It fails when the HTML is opened straight from disk, because a file:// page
 * cannot fetch siblings — that is expected, and why anything load-bearing belongs in modules/css/.
 */
importStyles("style.css")
	.then(() => console.info("Runtime stylesheet loaded."))
	.catch(() => console.info("Runtime stylesheet not loaded — serve over HTTP to pick up style.css."));

console.info(`Build ${StartConfig.version}${StartConfig.versionName ? ` (${StartConfig.versionName})` : ""}`);
