/**
 * Love interest catalogue and story-state helpers. Static entries live under Constants.loveInterests;
 * per-run customisation is stored on $loveInterests keyed by id.
 */

defineGlobalNamespaces("LoveInterests");

(function () {
	"use strict";

	/** Locale codes shown in the Display Name radios, in UI order. */
	const NAME_LOCALES = [
		{ value: "en", code: "EN" },
		{ value: "cn", code: "CN" },
		{ value: "jp", code: "JP" },
		{ value: "kr", code: "KR" },
	];

	/**
	 * @param {string} id Stable key used in $loveInterests and $liFocus
	 * @param {string} title Short epithet shown after the name
	 * @param {Object<string, string>} names Locale → display name (must include `en`)
	 * @returns {{id: string, name: string, title: string, names: Object<string, string>}}
	 */
	function entry(id, title, names) {
		return { id, name: names.en, title, names };
	}

	ConstantsLoader.add("loveInterests", {
		roster: [
			entry("caleb", "your Big Brother", {
				en: "Caleb",
				cn: "Xia Yizhou",
				jp: "Mahiru",
				kr: "Ha Wooju",
			}),
			entry("gideon", "the Flight Instructor", {
				en: "Gideon",
				cn: "Jiang Fei",
				jp: "Kaito",
				kr: "Jang Bin",
			}),
			entry("rafayel", "the Artist", {
				en: "Rafayel",
				cn: "Qi Yu",
				jp: "Homura",
				kr: "Ki Wook",
			}),
			entry("sylus", "the Onychinus Leader", {
				en: "Sylus",
				cn: "Qin Che",
				jp: "Shin",
				kr: "Jin-Woon",
			}),
			entry("valko", "the Werewolf", {
				en: "Valko",
				cn: "Ao Yin",
				jp: "Rouga",
				kr: "Oh In Hyeok",
			}),
			entry("xavier", "the Deepspace Hunter", {
				en: "Xavier",
				cn: "Shen Xinghui",
				jp: "Seiya",
				kr: "Sim Sunghoon",
			}),
			entry("zayne", "the Cardio Surgeon", {
				en: "Zayne",
				cn: "Li Shen",
				jp: "Rei",
				kr: "Lee Seoeon",
			}),
		],

		/** Cosmetics defaults applied to every love interest until the player customises them. */
		defaults: {
			nameLocale: "en",
			gender: "male",
			height: "tall",
			skinTone: "fair",
			hair: {
				length: "short",
				style: "neat",
			},
		},
	});

	/**
	 * Fresh cosmetics object for one love interest.
	 *
	 * @returns {object}
	 */
	function createDefaults() {
		return clone(C().loveInterests.defaults);
	}

	/**
	 * Ordered roster from constants.
	 *
	 * @returns {Array<{id: string, name: string, title: string, names: Object<string, string>}>}
	 */
	function roster() {
		return C().loveInterests.roster || [];
	}

	/**
	 * Locale options available for Display Name radios.
	 *
	 * @returns {Array<{value: string, code: string}>}
	 */
	function nameLocales() {
		return NAME_LOCALES;
	}

	/**
	 * Map of current display name → id for SugarCube <<listbox>> / <<optionsfrom>>.
	 * SugarCube uses object keys as labels and values as the stored selection.
	 *
	 * @param {object} [variables]
	 * @returns {Object<string, string>}
	 */
	function listboxOptions(variables) {
		const options = {};
		roster().forEach(li => {
			options[displayName(li.id, variables)] = li.id;
		});
		return options;
	}

	/**
	 * Looks up a roster entry by id.
	 *
	 * @param {string} id
	 * @returns {{id: string, name: string, title: string, names: Object<string, string>}|null}
	 */
	function get(id) {
		return roster().find(li => li.id === id) || null;
	}

	/**
	 * Selected display name for a love interest (falls back to English / roster name).
	 *
	 * @param {string} id
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function displayName(id, variables) {
		const vars = variables || V();
		const li = get(id);
		if (!li) return "";
		const locale = (vars.loveInterests && vars.loveInterests[id] && vars.loveInterests[id].nameLocale) || "en";
		if (li.names && li.names[locale]) return li.names[locale];
		return li.name || "";
	}

	/**
	 * Full header string, e.g. "Ao Yin the Werewolf".
	 *
	 * @param {string} id
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function displayTitle(id, variables) {
		const li = get(id);
		if (!li) return "";
		const name = displayName(id, variables);
		return li.title ? `${name} ${li.title}` : name;
	}

	/**
	 * Ensures `$loveInterests` and `$liFocus` exist. Safe on Start and after loads.
	 *
	 * @param {object} [variables] Defaults to live story variables.
	 * @returns {object} The loveInterests map.
	 */
	function ensure(variables) {
		const vars = variables || V();
		if (!vars.loveInterests || typeof vars.loveInterests !== "object") {
			vars.loveInterests = {};
		}

		const base = createDefaults();
		roster().forEach(li => {
			if (!vars.loveInterests[li.id] || typeof vars.loveInterests[li.id] !== "object") {
				vars.loveInterests[li.id] = createDefaults();
				return;
			}
			const target = vars.loveInterests[li.id];
			Object.keys(base).forEach(key => {
				if (target[key] === undefined) target[key] = clone(base[key]);
			});
			if (!target.hair || typeof target.hair !== "object") {
				target.hair = clone(base.hair);
			} else {
				Object.keys(base.hair).forEach(key => {
					if (target.hair[key] === undefined) target.hair[key] = base.hair[key];
				});
			}
		});

		const ids = roster().map(li => li.id);
		if (!vars.liFocus || !ids.includes(vars.liFocus)) {
			vars.liFocus = ids[0] || "";
		}
		return vars.loveInterests;
	}

	/**
	 * Moves `$liFocus` by delta through the roster, wrapping at the ends.
	 *
	 * @param {number} delta Usually -1 (previous) or 1 (next)
	 * @returns {string} The new focus id
	 */
	function stepFocus(delta) {
		const ids = roster().map(li => li.id);
		if (!ids.length) return "";
		const vars = V();
		const current = ids.indexOf(vars.liFocus);
		const index = current < 0 ? 0 : (current + delta + ids.length) % ids.length;
		vars.liFocus = ids[index];
		return vars.liFocus;
	}

	Object.assign(LoveInterests, {
		createDefaults,
		roster,
		nameLocales,
		listboxOptions,
		get,
		displayName,
		displayTitle,
		ensure,
		stepFocus,
	});
})();
