/**
 * Macros for world display, money, stats effects, pronouns, and love-interest names.
 */

(function () {
	"use strict";

	const EFFECT_STATS = ["stress", "arousal", "pain", "trauma", "energy", "hygiene", "hunger", "comfort"];

	EFFECT_STATS.forEach(stat => {
		DefineMacroS(stat, function (args) {
			const tier = args[0] != null ? String(args[0]) : "+";
			return Stats.applyEffect(stat, tier);
		});
	});

	DefineMacroS("hudTip", function () {
		const options = Options.ensure();
		if (!options.sidebarHints) return "";
		return Tips.markup();
	});

	DefineMacroS("hudStat", function (args) {
		return Stats.hudLine(String(args[0] || ""));
	});

	DefineMacroS("money", function (args) {
		const amount = args.length ? args[0] : Money.get();
		return Money.format(amount);
	});

	DefineMacroS("worldDate", function () {
		return World.formatDate();
	});

	DefineMacroS("worldDateLong", function () {
		return World.formatDateLong();
	});

	DefineMacroS("worldTime", function () {
		return World.formatTime();
	});

	DefineMacroS("worldWeather", function () {
		return World.weatherText();
	});

	DefineMacroS("worldTemp", function () {
		return World.formatTemperature();
	});

	DefineMacroS(["honorific", "honourific"], function () {
		return Pronouns.honorific();
	});

	/**
	 * <<pronouns "xavier">> — <<he>>/<<him>>/<<his>>/<<gendered>> follow that LI.
	 * <<pronouns "player">> or <<pronouns>> — back to the player.
	 */
	DefineMacro("pronouns", function (args) {
		const who = args.length && args[0] != null && String(args[0]).trim() !== "" ? String(args[0]) : "player";
		Pronouns.setFocus(who);
	});

	const PRONOUN_FORMS = [
		["he", "subject", false],
		["He", "subject", true],
		["she", "subject", false],
		["She", "subject", true],
		["him", "object", false],
		["Him", "object", true],
		["her", "object", false],
		["Her", "object", true],
		["his", "possessive", false],
		["His", "possessive", true],
		["hers", "possessiveNoun", false],
		["Hers", "possessiveNoun", true],
		["himself", "reflexive", false],
		["Himself", "reflexive", true],
		["herself", "reflexive", false],
		["Herself", "reflexive", true],
		["they", "subject", false],
		["They", "subject", true],
		["them", "object", false],
		["Them", "object", true],
		["their", "possessive", false],
		["Their", "possessive", true],
		["theirs", "possessiveNoun", false],
		["Theirs", "possessiveNoun", true],
		["themself", "reflexive", false],
		["Themself", "reflexive", true],
	];

	PRONOUN_FORMS.forEach(entry => {
		const name = entry[0];
		const formName = entry[1];
		const capitalise = entry[2];
		DefineMacroS(name, function () {
			return Pronouns.activeForm(formName, capitalise);
		});
	});

	/** <<gendered "boyish" "girlish" "sweet">> — uses the active <<pronouns>> focus. */
	DefineMacroS("gendered", function (args) {
		return Pronouns.activeGendered(String(args[0] || ""), String(args[1] || ""), String(args[2] || ""));
	});

	DefineMacroS("liname", function (args) {
		return LoveInterests.displayName(String(args[0] || ""));
	});
})();
