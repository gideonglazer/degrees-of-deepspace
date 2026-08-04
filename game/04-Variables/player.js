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

	Object.assign(Player, { createDefaults, ensure });
})();
