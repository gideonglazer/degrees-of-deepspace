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

Config.history.maxStates = StartConfig.debug ? 10 : 1;
Config.history.controls = StartConfig.debug;

Config.saves.maxSlotSaves = 500;
Config.saves.maxAutoSaves = 1;
Config.saves.isAllowed = function (saveType) {
	if (saveType === Save.Type.Auto) {
		return typeof SavesUI !== "undefined" && SavesUI.isAutoSaveAllowed();
	}
	return true;
};

Config.macros.maxLoopIterations = 5000;

State.prng.init();

l10nStrings.errorTitle = `${StartConfig.version} Error`;

Save.onLoad.add(function (save) {
	Errors.hide(true);
	save.state.history.forEach(moment => Versions.update(moment.variables));
});

/* Runtime stylesheet ------------------------------------------------------ */

importStyles("style.css")
	.then(() => console.info("Runtime stylesheet loaded."))
	.catch(() => console.info("Runtime stylesheet not loaded — serve over HTTP to pick up style.css."));

console.info(`Build ${StartConfig.version}${StartConfig.versionName ? ` (${StartConfig.versionName})` : ""}`);
