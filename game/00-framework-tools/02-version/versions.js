/**
 * Save migration registry.
 *
 * Saves store a snapshot of `State.variables`, so any variable you rename or restructure will break
 * old saves. Register a migration here instead of scattering defensive checks through game code:
 * each one is a small function that upgrades a save from one version to the next, and they run in
 * order until the save matches the current build.
 */

defineGlobalNamespaces("Versions");

(function () {
	"use strict";

	/** @type {Array<{version: string, numeric: number, describe: string, migrate: Function}>} */
	const migrations = [];

	/**
	 * Converts a dotted version string into a sortable integer.
	 * Each segment gets two digits, so 0.1.12 becomes 1_12 and 1.0.0 becomes 1_00_00.
	 *
	 * @param {string} version
	 * @returns {number}
	 */
	function toNumeric(version) {
		const parts = String(version)
			.replace(/[^0-9.]+/g, "")
			.split(".")
			.map(Number);
		return (parts[0] || 0) * 1000000 + (parts[1] || 0) * 10000 + (parts[2] || 0) * 100 + (parts[3] || 0);
	}

	/**
	 * Registers a migration that brings a save up to `version`.
	 *
	 * @param {string} version The build this migration produces a valid save for.
	 * @param {string} describe Short note for the changelog and console output.
	 * @param {Function} migrate Receives the save's `variables` object and mutates it in place.
	 */
	function register(version, describe, migrate) {
		migrations.push({ version, numeric: toNumeric(version), describe, migrate });
		migrations.sort((a, b) => a.numeric - b.numeric);
	}

	/**
	 * Applies every migration newer than the save's own version.
	 *
	 * @param {object} variables A save's `State.variables` snapshot.
	 * @returns {string[]} Descriptions of the migrations that ran.
	 */
	function update(variables) {
		if (!variables) return [];
		const from = toNumeric(variables.gameVersion || "0.0.0");
		const applied = [];

		migrations.forEach(entry => {
			if (entry.numeric <= from) return;
			Errors.guard(`migration to ${entry.version}`, () => {
				entry.migrate(variables);
				applied.push(`${entry.version}: ${entry.describe}`);
			});
		});

		variables.gameVersion = window.StartConfig ? StartConfig.version : variables.gameVersion;
		if (applied.length) console.info("Save migrated —", applied.join(" | "));
		return applied;
	}

	/**
	 * True when the save predates the running build and may need attention.
	 *
	 * @param {object} variables
	 * @returns {boolean}
	 */
	function isOutdated(variables) {
		if (!variables || !window.StartConfig) return false;
		return toNumeric(variables.gameVersion || "0.0.0") < toNumeric(StartConfig.version);
	}

	Object.assign(Versions, { register, update, isOutdated, toNumeric, list: () => migrations.slice() });
})();

/*
 * Migrations, oldest first. Keep them append-only: editing a released one means saves that already
 * ran it will not run the corrected version.
 */
