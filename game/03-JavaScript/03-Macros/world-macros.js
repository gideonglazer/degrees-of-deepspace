/**
 * Macros for world display, money, stats effects, pronouns, and love-interest names.
 */

(function () {
	"use strict";

	const EFFECT_STATS = ["stress", "arousal", "pain", "trauma", "energy", "hygiene", "hunger"];

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

	/**
	 * Passage option icon before a link (and before LinkNumberify's numkey).
	 * <<icon "bedroom">> → img/location-icons/bedroom.png
	 * <<icon "apartment-door" "gif">> → .gif in the same folder
	 * <<actionIcon "sleep-apt">> → img/action-icons/sleep-apt.png
	 * <<foodIcon "breakfast" "pancakes">> → img/food-icons/breakfast/pancakes.png
	 */
	function iconImg(folder, args) {
		const name = args[0] != null ? String(args[0]).trim() : "";
		if (!name) return "";
		const safe = name.replace(/[^a-zA-Z0-9_-]/g, "");
		if (!safe) return "";
		const rawExt = args[1] != null ? String(args[1]).trim().replace(/^\./, "").toLowerCase() : "png";
		const ext = rawExt === "gif" || rawExt === "webp" || rawExt === "jpg" || rawExt === "jpeg" ? rawExt : "png";
		return `<img class="icon" src="img/${folder}/${safe}.${ext}" alt="" aria-hidden="true">`;
	}

	DefineMacroS("icon", function (args) {
		return iconImg("location-icons", args);
	});

	DefineMacroS("actionIcon", function (args) {
		return iconImg("action-icons", args);
	});

	DefineMacroS("foodIcon", function (args) {
		const place = args[0] != null ? String(args[0]).trim().replace(/[^a-zA-Z0-9_-]/g, "") : "";
		if (!place) return "";
		return iconImg(`food-icons/${place}`, [args[1], args[2]]);
	});

	/**
	 * Vertical spacer between link groups, e.g. room actions vs leave links.
	 * <<gap>> / <<gap "sm">> / <<gap "md">> / <<gap "lg">> — or <<gap 1>>–<<gap 3>>.
	 */
	DefineMacroS("gap", function (args) {
		let size = "md";
		if (args.length && args[0] != null && String(args[0]).trim() !== "") {
			const raw = String(args[0]).trim().toLowerCase();
			if (raw === "1" || raw === "sm" || raw === "small") size = "sm";
			else if (raw === "3" || raw === "lg" || raw === "large") size = "lg";
			else size = "md";
		}
		return `<div class="passage-gap passage-gap-${size}" aria-hidden="true"></div>`;
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

	/** <<aged "student" "hunter">> — younger text, then older text. */
	DefineMacroS("aged", function (args) {
		return Player.aged(String(args[0] || ""), String(args[1] || ""));
	});

	DefineMacroS("liname", function (args) {
		return LoveInterests.displayName(String(args[0] || ""));
	});

	/**
	 * <<love "xavier" "+">> — applies a love tier and prints the indicator.
	 */
	DefineMacroS("love", function (args) {
		const id = args[0] != null ? String(args[0]) : "";
		const tier = args[1] != null ? String(args[1]) : "+";
		return LoveInterests.applyLove(id, tier);
	});

	/**
	 * <<longing "xavier" "+">> — applies a longing tier and prints the indicator.
	 */
	DefineMacroS("longing", function (args) {
		const id = args[0] != null ? String(args[0]) : "";
		const tier = args[1] != null ? String(args[1]) : "+";
		return LoveInterests.applyStat(id, "longing", tier);
	});

	/**
	 * <<listat "xavier" "dominance" "+">> — applies any LI relationship stat tier.
	 */
	DefineMacroS("listat", function (args) {
		const id = args[0] != null ? String(args[0]) : "";
		const key = args[1] != null ? String(args[1]) : "";
		const tier = args[2] != null ? String(args[2]) : "+";
		return LoveInterests.applyStat(id, key, tier);
	});

	/**
	 * <<socialCard "xavier">> — one Primary Relationships card (Social modal).
	 */
	DefineMacro("socialCard", function (args) {
		const id = args[0] != null ? String(args[0]) : "";
		if (!id || !LoveInterests.get(id)) return;
		$(Social.cardMarkup(id)).appendTo(this.output);
	});
})();
