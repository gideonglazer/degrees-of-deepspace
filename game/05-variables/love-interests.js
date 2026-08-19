/**
 * Love interest catalogue and story-state helpers. Static entries live under Constants.loveInterests;
 * per-run customisation is stored on $loveInterests keyed by id.
 *
 * Visibility in Social uses Flags like metXavier / metCaleb (see metFlag / meet / hasMet).
 */

defineGlobalNamespaces("LoveInterests");

(function () {
	"use strict";

	const NAME_LOCALES = C().loveInterests.nameLocales;

	/**
	 * Fresh cosmetics + relationship object for one love interest.
	 */
	function createDefaults(id) {
		const base = clone(C().loveInterests.defaults);
		if (id) {
			const unique = (C().loveInterests.uniqueStats && C().loveInterests.uniqueStats[id]) || [];
			unique.forEach(key => {
				if (base[key] === undefined) base[key] = 0;
			});
		}
		return base;
	}

	/**
	 * Ordered roster from constants.
	 */
	function roster() {
		return C().loveInterests.roster || [];
	}

	/**
	 * Locale options available for Display Name radios.
	 */
	function nameLocales() {
		return NAME_LOCALES;
	}

	/**
	 * Map of current display name → id for SugarCube <<listbox>> / <<optionsfrom>>.
	 * SugarCube uses object keys as labels and values as the stored selection.
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
	 */
	function get(id) {
		return roster().find(li => li.id === id) || null;
	}

	/**
	 * Selected display name for a love interest (falls back to English / roster name).
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
	 * Epithet only, e.g. "the Deepspace Hunter".
	 * Caleb's title follows LI gender (brother / sister / sibling).
	 */
	function displayEpithet(id, variables) {
		const li = get(id);
		if (!li || !li.title) return "";
		if (id === "caleb" && typeof Pronouns !== "undefined") {
			return Pronouns.gendered(
				Pronouns.liGender("caleb", variables),
				"your Big Brother",
				"your Big Sister",
				"your Sibling"
			);
		}
		return li.title;
	}

	/**
	 * Full header string, e.g. "Ao Yin the Werewolf".
	 */
	function displayTitle(id, variables) {
		const li = get(id);
		if (!li) return "";
		const name = displayName(id, variables);
		const epithet = displayEpithet(id, variables);
		return epithet ? `${name} ${epithet}` : name;
	}

	/**
	 * Flag id for first encounter, e.g. xavier → metXavier.
	 */
	function metFlag(id) {
		const key = String(id || "");
		if (!key) return "";
		return "met" + key.charAt(0).toUpperCase() + key.slice(1);
	}

	function hasMet(id, variables) {
		const flag = metFlag(id);
		return flag ? Flags.get(flag, variables) : false;
	}

	/**
	 * Marks a love interest as met (unlocks them in Social).
	 */
	function meet(id, variables) {
		const flag = metFlag(id);
		if (!flag || !get(id)) return false;
		return Flags.set(flag, true, variables);
	}

	/**
	 * Roster entries the player has encountered.
	 */
	function known(variables) {
		return roster().filter(li => hasMet(li.id, variables));
	}

	/**
	 * Stat keys shown for a love interest (universal + unique).
	 */
	function statsFor(id) {
		const universal = (C().loveInterests.universalStats || ["affinity", "longing"]).slice();
		const unique = (C().loveInterests.uniqueStats && C().loveInterests.uniqueStats[id]) || [];
		return universal.concat(unique.filter(key => !universal.includes(key)));
	}

	function statLabel(key) {
		const labels = C().loveInterests.statLabels || {};
		if (labels[key]) return labels[key];
		return key ? key.charAt(0).toUpperCase() + key.slice(1) : "";
	}

	/**
	 * Ensures `$loveInterests` and `$liFocus` exist. Safe on Start and after loads.
	 */
	function ensure(variables) {
		const vars = variables || V();
		if (!vars.loveInterests || typeof vars.loveInterests !== "object") {
			vars.loveInterests = {};
		}
		if (typeof Flags !== "undefined") Flags.ensure(vars);

		roster().forEach(li => {
			const base = createDefaults(li.id);
			if (!vars.loveInterests[li.id] || typeof vars.loveInterests[li.id] !== "object") {
				vars.loveInterests[li.id] = createDefaults(li.id);
				return;
			}
			const target = vars.loveInterests[li.id];
			if (target.love !== undefined) {
				if (target.affinity === undefined) target.affinity = Number(target.love) || 0;
				delete target.love;
			}
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
			statsFor(li.id).forEach(key => {
				if (target[key] === undefined) target[key] = 0;
				target[key] = Math.max(0, Math.min(statMax(), Math.round(Number(target[key]) || 0)));
			});
		});

		const ids = roster().map(li => li.id);
		if (!vars.liFocus || !ids.includes(vars.liFocus)) {
			vars.liFocus = ids[0] || "";
		}

		/*
		 * Backfill metXavier for saves that already finished the intro before met flags existed.
		 * The permanent morning-walk reminder is only added on Intro Xavier Morning.
		 */
		if (
			!hasMet("xavier", vars) &&
			typeof Journal !== "undefined" &&
			Journal.find("xavier-morning-walk", vars)
		) {
			meet("xavier", vars);
		}

		return vars.loveInterests;
	}

	function statMax() {
		return Number(C().loveInterests.affinityMax) || 100;
	}

	function affinityTiers() {
		return C().loveInterests.affinityTiers || {};
	}

	/**
	 * Moves `$liFocus` by delta through the roster, wrapping at the ends.
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

	/**
	 * Current value for a relationship stat (0–affinityMax).
	 */
	function getStat(id, key, variables) {
		const vars = variables || V();
		ensure(vars);
		const entry = vars.loveInterests[id];
		if (!entry || !statsFor(id).includes(key)) return 0;
		return Math.max(0, Math.round(Number(entry[key]) || 0));
	}

	/**
	 * Current affinity value for a love interest (0–affinityMax).
	 */
	function affinity(id, variables) {
		return getStat(id, "affinity", variables);
	}

	/** Alias for affinity(). */
	function love(id, variables) {
		return affinity(id, variables);
	}

	/**
	 * Current longing value for a love interest (0–affinityMax).
	 */
	function longing(id, variables) {
		return getStat(id, "longing", variables);
	}

	/**
	 * Markup for a tiered relationship-stat change without applying it (link previews).
	 */
	function effectMarkup(id, key, tier, variables) {
		const parsed = typeof Stats !== "undefined" && Stats.parseTier ? Stats.parseTier(tier) : null;
		const table = affinityTiers();
		if (!parsed || !get(id) || !statsFor(id).includes(key)) return "";
		const plusKey = parsed.key.replace(/-/g, "+");
		if (table[plusKey] === undefined) return "";

		const intensity = plusKey.length;
		const up = parsed.sign > 0;
		const mark = up ? "+".repeat(intensity) : "-".repeat(intensity);
		const name = displayName(id, variables);
		const label = name ? `${name}'s ${statLabel(key)}` : statLabel(key);
		const tone = up ? "good" : "bad";
		const cssKey = key === "affinity" ? "affinity" : `li-${key}`;
		return (
			`<span class="stat-effect-wrap">` +
			` <span class="stat-effect-pipe">|</span> ` +
			`<span class="stat-effect stat-${cssKey} stat-effect-${tone}">` +
			`<span class="stat-delta">${mark}</span>` +
			`<span class="stat-name">${label}</span>` +
			`</span>` +
			`</span>`
		);
	}

	/**
	 * Applies a tiered relationship-stat change and returns coloured indicator markup.
	 */
	function applyStat(id, key, tier, variables) {
		const vars = variables || V();
		ensure(vars);
		if (!vars.loveInterests[id] || !statsFor(id).includes(key)) return "";
		const parsed = typeof Stats !== "undefined" && Stats.parseTier ? Stats.parseTier(tier) : null;
		const table = affinityTiers();
		const max = statMax();
		if (!parsed) return "";
		const plusKey = parsed.key.replace(/-/g, "+");
		const magnitude = table[plusKey];
		if (magnitude === undefined) return "";

		const entry = vars.loveInterests[id];
		entry[key] = Math.max(0, Math.min(max, (Number(entry[key]) || 0) + magnitude * parsed.sign));
		return effectMarkup(id, key, tier, vars);
	}

	/**
	 * Markup for a tiered affinity change without applying it (link previews).
	 */
	function affinityEffectMarkup(id, tier, variables) {
		return effectMarkup(id, "affinity", tier, variables);
	}

	/**
	 * Applies a tiered affinity change and returns coloured indicator markup.
	 */
	function applyAffinity(id, tier, variables) {
		return applyStat(id, "affinity", tier, variables);
	}

	Object.assign(LoveInterests, {
		createDefaults,
		roster,
		nameLocales,
		listboxOptions,
		get,
		displayName,
		displayEpithet,
		displayTitle,
		metFlag,
		hasMet,
		meet,
		known,
		statsFor,
		statLabel,
		ensure,
		stepFocus,
		statMax,
		getStat,
		affinity,
		love,
		longing,
		effectMarkup: affinityEffectMarkup,
		statEffectMarkup: effectMarkup,
		applyAffinity,
		applyLove: applyAffinity,
		applyStat,
	});

	/** Convenience macros <<Xavier>>, <<Rafayel>>, … — registered here so the roster already exists. */
	roster().forEach(li => {
		const macroName = li.name;
		if (!macroName || Macro.get(macroName)) return;
		DefineMacroS(macroName, function () {
			return displayName(li.id);
		});
	});
})();
