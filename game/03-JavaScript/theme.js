/**
 * Colour theme preference. Mirrors Degrees of Lewdity: preference in localStorage, applied as
 * data-theme on <html>. Default is Catppuccin Mocha.
 */

defineGlobalNamespaces("Theme");

(function () {
	"use strict";

	const STORAGE_KEY = "dodTheme";
	const DEFAULT_PREFERENCE = "mocha";
	/** Removed themes still stored in older browsers map back to the default. */
	const REMOVED_PREFERENCES = new Set(["pink-cream"]);

	/** @type {MediaQueryList|null} */
	let isDarkPreferredQuery = null;

	/**
	 * @returns {string}
	 */
	function getPreference() {
		const stored = localStorage.getItem(STORAGE_KEY) || DEFAULT_PREFERENCE;
		if (REMOVED_PREFERENCES.has(stored)) {
			localStorage.setItem(STORAGE_KEY, DEFAULT_PREFERENCE);
			return DEFAULT_PREFERENCE;
		}
		return stored;
	}

	/**
	 * @param {string} theme Resolved theme id written to data-theme
	 */
	function setTheme(theme) {
		document.documentElement.setAttribute("data-theme", theme);
	}

	/**
	 * @param {{matches: boolean}} event
	 */
	function onThemeChange(event) {
		setTheme(event.matches ? "dark" : "light");
	}

	/**
	 * Maps a stored preference to a concrete data-theme value.
	 *
	 * @param {string} preference
	 */
	function reflectPreference(preference) {
		let theme;

		if (preference === "system-default") {
			if (isDarkPreferredQuery) {
				isDarkPreferredQuery.removeEventListener("change", onThemeChange);
			}
			isDarkPreferredQuery = window.matchMedia("(prefers-color-scheme: dark)");
			theme = isDarkPreferredQuery.matches ? "dark" : "light";
			if (typeof isDarkPreferredQuery.addEventListener === "function") {
				isDarkPreferredQuery.addEventListener("change", onThemeChange);
			}
		} else {
			if (isDarkPreferredQuery) {
				isDarkPreferredQuery.removeEventListener("change", onThemeChange);
				isDarkPreferredQuery = null;
			}
			theme = preference;
		}

		setTheme(theme);
	}

	/**
	 * @param {string} preference
	 */
	function setPreference(preference) {
		localStorage.setItem(STORAGE_KEY, preference);
		reflectPreference(preference);
	}

	/**
	 * Checks the matching theme radio and wires change handlers.
	 */
	function initControl() {
		const preference = getPreference();
		jQuery(`input[name=theme][value="${preference}"]`).prop("checked", true);
		jQuery("input[name=theme]")
			.off("change.dodTheme")
			.on("change.dodTheme", function () {
				setPreference(this.value);
			});
	}

	// Apply as soon as this script loads so the first paint is not the wrong palette
	reflectPreference(getPreference());

	Object.assign(Theme, {
		STORAGE_KEY,
		DEFAULT_PREFERENCE,
		getPreference,
		setPreference,
		reflectPreference,
		setTheme,
		initControl,
	});
})();
