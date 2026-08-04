/**
 * Player appearance helpers. Defaults live in Constants.character.defaults; story state is $player.
 */

defineGlobalNamespaces("Player");

(function () {
	"use strict";

	/**
	 * Fresh cosmetics object matching the character creator fields.
	 *
	 * @returns {object}
	 */
	function createDefaults() {
		return clone(C().character.defaults);
	}

	/**
	 * Ensures `$player` exists with every cosmetics field. Safe to call on Start and after loads.
	 *
	 * @param {object} [variables] Defaults to live story variables.
	 * @returns {object} The player object.
	 */
	function ensure(variables) {
		const vars = variables || V();
		if (!vars.player || typeof vars.player !== "object") {
			vars.player = createDefaults();
			return vars.player;
		}

		const defaults = createDefaults();
		Object.keys(defaults).forEach(key => {
			if (vars.player[key] === undefined) {
				vars.player[key] = defaults[key];
			}
		});
		if (!vars.player.hair || typeof vars.player.hair !== "object") {
			vars.player.hair = defaults.hair;
		} else {
			Object.keys(defaults.hair).forEach(key => {
				if (vars.player.hair[key] === undefined) vars.player.hair[key] = defaults.hair[key];
			});
		}
		return vars.player;
	}

	/**
	 * Picks a random catalogue value from Constants.character[listKey].
	 *
	 * @param {string} listKey
	 * @returns {string|undefined}
	 */
	function pickCatalogue(listKey) {
		const options = C().character[listKey];
		const entry = pickRandomItemInArray(options);
		return entry ? entry.value : undefined;
	}

	/**
	 * Overwrites `$player` cosmetics with a random pick from each character catalogue.
	 *
	 * @param {object} [variables] Defaults to live story variables.
	 * @returns {object} The player object.
	 */
	function randomize(variables) {
		const vars = variables || V();
		const player = ensure(vars);
		const eyeColor = pickCatalogue("eyeColors");

		player.gender = pickCatalogue("genders");
		player.clothingPref = pickCatalogue("clothingPrefs");
		player.age = pickCatalogue("ages");
		player.height = pickCatalogue("heights");
		player.hair = {
			length: pickCatalogue("hairLengths"),
			style: pickCatalogue("hairStyles"),
			type: pickCatalogue("hairTypes"),
			color: pickCatalogue("hairColors"),
		};
		player.vocalTone = pickCatalogue("vocalTones");
		player.skinTone = pickCatalogue("skinTones");
		player.eyeShape = pickCatalogue("eyeShapes");
		player.bodyShape = pickCatalogue("bodyShapes");
		player.faceShape = pickCatalogue("faceShapes");
		player.freckles = getRandomIntInclusive(0, 1) === 1;
		player.heterochromia = getRandomIntInclusive(0, 1) === 1;
		player.eyeColor = eyeColor;

		if (player.heterochromia) {
			player.eyeColorLeft = pickCatalogue("eyeColors");
			player.eyeColorRight = pickCatalogue("eyeColors");
		} else {
			player.eyeColorLeft = eyeColor;
			player.eyeColorRight = eyeColor;
		}

		return player;
	}

	/**
	 * Resets `$player` cosmetics to Constants.character.defaults.
	 *
	 * @param {object} [variables] Defaults to live story variables.
	 * @returns {object} The player object.
	 */
	function resetToDefaults(variables) {
		const vars = variables || V();
		vars.player = createDefaults();
		return vars.player;
	}

	Object.assign(Player, { createDefaults, ensure, randomize, resetToDefaults });
})();
