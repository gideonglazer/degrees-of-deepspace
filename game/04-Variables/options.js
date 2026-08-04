/**
 * Display options ($options): general prefs, typography, text animations, and theme-default bookmarks.
 */

defineGlobalNamespaces("Options");

(function () {
	"use strict";

	const DEFAULTS_KEY = "dodDefaultThemeSettings";

	const FONT_CLASSES = [
		"Arial",
		"Verdana",
		"TimesNewRoman",
		"Georgia",
		"Garamond",
		"CourierNew",
		"LucidaConsole",
		"Monaco",
		"OpenDyslexicMono",
		"ComicSans",
		"Lexend",
	];

	const LINE_HEIGHT_CLASSES = ["lineHeight1", "lineHeight125", "lineHeight15", "lineHeight175", "lineHeight2"];
	const FONT_SIZE_CLASSES = ["fontSize10", "fontSize12", "fontSize14", "fontSize16", "fontSize18", "fontSize20"];

	/**
	 * @returns {object}
	 */
	function createDefaults() {
		return {
			dateFormat: "MM/DD/YYYY",
			temperature: "fahrenheit",
			timeFormat: "12",
			sidebarHints: true,
			passageLineHeight: undefined,
			overlayLineHeight: undefined,
			sidebarLineHeight: undefined,
			passageFontSize: undefined,
			overlayFontSize: undefined,
			sidebarFontSize: undefined,
			font: "",
			textAnimsAll: true,
			textAnimsDrunk: true,
			textAnimsHeat: true,
			textAnimsHypno: true,
		};
	}

	/**
	 * Ensures `$options` exists with every theme/display field.
	 *
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function ensure(variables) {
		const vars = variables || V();
		if (!vars.options || typeof vars.options !== "object") {
			vars.options = createDefaults();
		} else {
			const defaults = createDefaults();
			Object.keys(defaults).forEach(key => {
				/* Skip keys whose default is intentionally undefined (e.g. typography "Default") */
				if (vars.options[key] === undefined && defaults[key] !== undefined) {
					vars.options[key] = defaults[key];
				}
			});
		}

		const saved = loadSavedDefaults();
		if (saved) {
			["passageLineHeight", "overlayLineHeight", "sidebarLineHeight", "passageFontSize", "overlayFontSize", "sidebarFontSize", "font"].forEach(key => {
				if (vars.options[key] === undefined && saved[key] !== undefined) {
					vars.options[key] = saved[key];
				}
			});
		}

		return vars.options;
	}

	/**
	 * @returns {object|null}
	 */
	function loadSavedDefaults() {
		try {
			const raw = localStorage.getItem(DEFAULTS_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch (err) {
			return null;
		}
	}

	/**
	 * Persists current typography choices as the player's default set.
	 */
	function saveCurrentAsDefault() {
		const options = ensure();
		const payload = { theme: Theme.getPreference() };
		["passageLineHeight", "overlayLineHeight", "sidebarLineHeight", "passageFontSize", "overlayFontSize", "sidebarFontSize", "font"].forEach(key => {
			if (options[key] !== undefined && options[key] !== "") payload[key] = options[key];
		});
		localStorage.setItem(DEFAULTS_KEY, JSON.stringify(payload));
	}

	/**
	 * Clears saved theme defaults from localStorage.
	 */
	function resetDefaults() {
		localStorage.removeItem(DEFAULTS_KEY);
	}

	/**
	 * @param {number|string|undefined} value
	 * @returns {string}
	 */
	function lineHeightClass(value) {
		if (value == null || value === "") return "";
		const n = Number(value);
		if (n === 1) return "lineHeight1";
		if (n === 1.25) return "lineHeight125";
		if (n === 1.5) return "lineHeight15";
		if (n === 1.75) return "lineHeight175";
		if (n === 2) return "lineHeight2";
		return "";
	}

	/**
	 * @param {number|string|undefined} value
	 * @returns {string}
	 */
	function fontSizeClass(value) {
		if (value == null || value === "") return "";
		const n = Number(value);
		return FONT_SIZE_CLASSES.includes(`fontSize${n}`) ? `fontSize${n}` : "";
	}

	/**
	 * Applies font / size / line-height classes to passages, sidebar, and html.
	 * Font classes live on <html>; body inherits so the whole Start screen updates.
	 */
	function applyTypography() {
		const options = ensure();
		const $html = jQuery(document.documentElement);
		const $passages = jQuery("#passages");
		const $sidebar = jQuery("#ui-bar-body, #story-caption");

		FONT_CLASSES.forEach(name => $html.removeClass(name));
		if (options.font) $html.addClass(String(options.font));

		LINE_HEIGHT_CLASSES.forEach(name => {
			$passages.removeClass(name);
			$sidebar.removeClass(name);
		});
		FONT_SIZE_CLASSES.forEach(name => {
			$passages.removeClass(name);
			$sidebar.removeClass(name);
		});

		const passageLh = lineHeightClass(options.passageLineHeight);
		const passageFs = fontSizeClass(options.passageFontSize);
		if (passageLh) $passages.addClass(passageLh);
		if (passageFs) $passages.addClass(passageFs);

		const sidebarLh = lineHeightClass(options.sidebarLineHeight);
		const sidebarFs = fontSizeClass(options.sidebarFontSize);
		if (sidebarLh) $sidebar.addClass(sidebarLh);
		if (sidebarFs) $sidebar.addClass(sidebarFs);
	}

	/**
	 * CSS class string for drunk-text previews / markup.
	 *
	 * @returns {string}
	 */
	function basicDrunkCss() {
		const options = ensure();
		if (!options.textAnimsAll || !options.textAnimsDrunk) return "drunk-text";
		return "drunk-text drunk-1";
	}

	/**
	 * @returns {string}
	 */
	function basicJitterCss() {
		const options = ensure();
		if (!options.textAnimsAll || !options.textAnimsHeat) return "jitter-text";
		return "jitter-text jitter-1";
	}

	/**
	 * @returns {string}
	 */
	function basicHypnoCss() {
		const options = ensure();
		if (!options.textAnimsAll || !options.textAnimsHypno) return "hypno-text";
		return "hypno-text hypno";
	}

	/**
	 * Refreshes animation preview spans on the Themes tab.
	 */
	function refreshAnimPreviews() {
		const $drunk = jQuery("#prevDrunk");
		if ($drunk.length) $drunk.attr("class", basicDrunkCss());
		const $heat = jQuery("#prevHeat");
		if ($heat.length) $heat.attr("class", basicJitterCss());
		const $hypno = jQuery("#prevHypno");
		if ($hypno.length) $hypno.attr("class", basicHypnoCss());
	}

	Object.assign(Options, {
		DEFAULTS_KEY,
		createDefaults,
		ensure,
		loadSavedDefaults,
		saveCurrentAsDefault,
		resetDefaults,
		applyTypography,
		basicDrunkCss,
		basicJitterCss,
		basicHypnoCss,
		refreshAnimPreviews,
	});

	// SugarCube passage templates can call these by bare name like DoL
	window.basicDrunkCss = basicDrunkCss;
	window.basicJitterCss = basicJitterCss;
	window.basicHypnoCss = basicHypnoCss;
})();
