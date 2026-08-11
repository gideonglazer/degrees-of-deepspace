defineGlobalNamespaces("Stats");

(function () {
	"use strict";

	const FATIGUE_MAX = 2000;
	const AROUSAL_MAX = 10000;
	const PAIN_MAX = 200;
	const STRESS_MAX = 10000;
	const CONTROL_MAX = 10000;
	const PERCENT_MAX = 100;

	const TIERS = {
		stress: { "+": 100, "++": 250, "+++": 500 },
		arousal: { "+": 200, "++": 500, "+++": 1000 },
		pain: { "+": 5, "++": 15, "+++": 30 },
		control: { "+": 50, "++": 150, "+++": 300 },
		energy: { "+": 5, "++": 10, "+++": 20 },
		fatigue: { "+": 100, "++": 300, "+++": 600 },
		hygiene: { "+": 50, "++": 100, "+++": 100 },
		hunger: { "+": 5, "++": 10, "+++": 20 },
	};

	const LABELS = {
		stress: "Stress",
		arousal: "Arousal",
		pain: "Pain",
		control: "Control",
		energy: "Energy",
		fatigue: "Fatigue",
		hygiene: "Hygiene",
		hunger: "Hunger",
	};

	function createDefaults() {
		return {
			fatigue: 0,
			arousal: 0,
			pain: 0,
			stress: 0,
			control: 0,
			hygiene: 100,
			hunger: 80,
		};
	}

	function ensure(variables) {
		const vars = variables || V();
		if (!vars.stats || typeof vars.stats !== "object") {
			vars.stats = createDefaults();
		} else {
			const defaults = createDefaults();
			Object.keys(defaults).forEach(key => {
				if (vars.stats[key] === undefined) vars.stats[key] = defaults[key];
			});
			/* Migrate legacy energy field into fatigue if present */
			if (vars.stats.energy !== undefined && vars.stats.fatigue === undefined) {
				vars.stats.fatigue = energyToFatigue(vars.stats.energy);
			}
			/* Migrate legacy trauma into control if present */
			if (vars.stats.trauma !== undefined) {
				if (vars.stats.control === undefined) {
					vars.stats.control = vars.stats.trauma;
				}
				delete vars.stats.trauma;
			}
			delete vars.stats.energy;
			delete vars.stats.comfort;
		}
		clampAll(vars.stats);
		return vars.stats;
	}

	function energyToFatigue(energy) {
		const e = Math.max(0, Math.min(PERCENT_MAX, Number(energy) || 0));
		return Math.round((PERCENT_MAX - e) * (FATIGUE_MAX / PERCENT_MAX));
	}

	function fatigueToEnergy(fatigue) {
		const f = Math.max(0, Math.min(FATIGUE_MAX, Number(fatigue) || 0));
		return Math.round(PERCENT_MAX - f / (FATIGUE_MAX / PERCENT_MAX));
	}

	function clampAll(stats) {
		stats.fatigue = Math.max(0, Math.min(FATIGUE_MAX, Math.round(Number(stats.fatigue) || 0)));
		stats.arousal = Math.max(0, Math.min(AROUSAL_MAX, Math.round(Number(stats.arousal) || 0)));
		stats.pain = Math.max(0, Math.min(PAIN_MAX, Math.round(Number(stats.pain) || 0)));
		stats.stress = Math.max(0, Math.min(STRESS_MAX, Math.round(Number(stats.stress) || 0)));
		stats.control = Math.max(0, Math.min(CONTROL_MAX, Math.round(Number(stats.control) || 0)));
		stats.hygiene = Math.max(0, Math.min(PERCENT_MAX, Number(stats.hygiene) || 0));
		stats.hunger = Math.max(0, Math.min(PERCENT_MAX, Number(stats.hunger) || 0));
	}

	/**
	 * Public energy getter (0–100).
	 */
	function energy(variables) {
		return fatigueToEnergy(ensure(variables).fatigue);
	}

	function setEnergy(value, variables) {
		const stats = ensure(variables);
		stats.fatigue = energyToFatigue(value);
	}

	/**
	 * Passive changes per minute while awake
	 */
	function passiveDecay(minutes, variables) {
		const stats = ensure(variables);
		const m = Math.max(0, Math.floor(Number(minutes) || 0));
		if (!m) return;

		/* +1.25 fatigue per minute awake (~4% energy/hr; empty in ~27h) */
		stats.fatigue += 1.25 * m;
		/* Arousal decays ~10 per minute */
		stats.arousal -= 10 * m;
		/* Eases over time (~1 per 2 minutes on 0–200 scale) */
		stats.pain -= Math.floor(m / 2);
		/* Stress usually decreases over time (~2 per minute on 0–10000) */
		stats.stress -= 2 * m;
		/* Control eases slowly (~1 per 5 minutes) */
		stats.control -= Math.floor(m / 5);
		/* Day-to-day needs: meal every few hours, wash about once a day */
		stats.hygiene -= m / 12;
		stats.hunger -= m / 6;

		clampAll(stats);
	}

	/**
	 * Stat changes per minute while asleep. Fatigue recovers.
	 */
	function sleepEffects(minutes, variables) {
		const stats = ensure(variables);
		const m = Math.max(0, Math.floor(Number(minutes) || 0));
		if (!m) return;

		/* -2.5 fatigue per minute → ~1200 over 8h, ~1800 over 12h */
		stats.fatigue -= 2.5 * m;
		stats.arousal -= 10 * m;
		stats.pain -= Math.floor(m / 2);
		stats.stress -= 2 * m;
		stats.control -= Math.floor(m / 5);
		stats.hygiene -= m / 24;
		stats.hunger -= m / 15;

		clampAll(stats);
	}

	/**
	 * True when Energy is at or below 20 (fatigue ≥ 1600).
	 */
	function isExhausted(variables) {
		return energy(variables) <= 20;
	}

	/**
	 * Parses "+", "++", "+++", "-", "--", "---" into a signed multiplier of the base tier.
	 */
	function parseTier(tier) {
		const raw = String(tier || "").trim();
		const match = raw.match(/^([+-])(\1{0,2})$/);
		if (!match) return null;
		const sign = match[1] === "+" ? 1 : -1;
		const key = match[1].repeat(1 + match[2].length);
		return { sign, key };
	}

	/** Stats that are "harmful" when they rise. */
	const NEGATIVE_STATS = ["stress", "arousal", "pain", "control", "fatigue"];

	/**
	 * Markup for a tiered change without applying it. Use to preview an action's cost.
	 */
	function effectMarkup(stat, tier) {
		const parsed = parseTier(tier);
		const table = TIERS[stat];
		if (!parsed || !table) return "";
		const plusKey = parsed.key.replace(/-/g, "+");
		if (table[plusKey] === undefined) return "";

		const intensity = plusKey.length;
		const up = parsed.sign > 0;
		const mark = up ? "+".repeat(intensity) : "\u2212".repeat(intensity);
		const label = LABELS[stat] || stat;
		const harmful = NEGATIVE_STATS.includes(stat);
		/* Harmful stats: rising is bad, falling is good. Others invert. */
		const tone = harmful === up ? "bad" : "good";
		return (
			`<span class="stat-effect-wrap">` +
			` <span class="stat-effect-pipe">|</span> ` +
			`<span class="stat-effect stat-${stat} stat-effect-${tone}">` +
			`<span class="stat-delta">${mark}</span>` +
			`<span class="stat-name">${label}</span>` +
			`</span>` +
			`</span>`
		);
	}

	/**
	 * Applies a tiered change and returns markup for the coloured indicator.
	 */
	function applyEffect(stat, tier, variables) {
		const stats = ensure(variables);
		const parsed = parseTier(tier);
		const table = TIERS[stat];
		if (!parsed || !table) return "";
		const plusKey = parsed.key.replace(/-/g, "+");
		const magnitude = table[plusKey];
		if (magnitude === undefined) return "";
		const delta = magnitude * parsed.sign;

		if (stat === "energy") {
			/* +energy restores; fatigue moves opposite */
			stats.fatigue -= delta * (FATIGUE_MAX / PERCENT_MAX);
		} else {
			stats[stat] = (Number(stats[stat]) || 0) + delta;
		}
		clampAll(stats);

		return effectMarkup(stat, tier);
	}

	/**
	 * Preview markup for a map of stat → tier (no state change).
	 */
	function effectsMarkup(effects) {
		if (!effects || typeof effects !== "object") return "";
		let markup = "";
		Object.keys(effects).forEach(stat => {
			markup += effectMarkup(stat, effects[stat]);
		});
		return markup;
	}

	/**
	 * Applies a map of stat → tier and returns concatenated effect markup.
	 */
	function applyEffects(effects, variables) {
		if (!effects || typeof effects !== "object") return "";
		let markup = "";
		Object.keys(effects).forEach(stat => {
			markup += applyEffect(stat, effects[stat], variables);
		});
		return markup;
	}

	/**
	 * Sidebar / prose band description for a stat.
	 */
	function describe(stat, variables) {
		const stats = ensure(variables);
		if (stat === "energy") {
			const e = energy(variables);
			if (e >= 100) return "You are refreshed.";
			if (e >= 80) return "You are wide awake.";
			if (e >= 60) return "You are alert.";
			if (e >= 40) return "You are wearied.";
			if (e >= 20) return "You are tired.";
			if (e > 0) return "You are fatigued.";
			return "You are exhausted.";
		}
		if (stat === "pain") {
			const p = stats.pain;
			if (p <= 0) return "You feel okay.";
			if (p < 20) return "You are upset.";
			if (p < 40) return "Tears well in your eyes.";
			if (p < 60) return "Tears run down your face.";
			if (p < 80) return "You are crying.";
			return "You cry and whimper.";
		}
		if (stat === "arousal") {
			const a = stats.arousal;
			if (a <= 0) return "You feel calm.";
			if (a < 2000) return "You feel sensual.";
			if (a < 4000) return "You feel aroused.";
			if (a < 6000) return "You feel lustful.";
			if (a < 8000) return "You feel horny.";
			if (a < 10000) return "A heat rises within.";
			return "You shake with arousal.";
		}
		if (stat === "stress") {
			const s = stats.stress;
			if (s <= 0) return "You are serene.";
			if (s < 2000) return "You are placid.";
			if (s < 4000) return "You are calm.";
			if (s < 6000) return "You are tense.";
			if (s < 8000) return "You are strained.";
			if (s < 10000) return "You are distressed.";
			return "You are overwhelmed!";
		}
		if (stat === "control") {
			const c = stats.control;
			if (c <= 0) return "You are in control.";
			if (c < 1000) return "You feel a little off.";
			if (c < 2000) return "You feel pressured.";
			if (c < 4000) return "You feel constrained.";
			if (c < 6000) return "You are losing your grip.";
			if (c < 8000) return "You are losing control.";
			return "You are out of control.";
		}
		if (stat === "hygiene") {
			const h = stats.hygiene;
			if (h >= 80) return "You are clean.";
			if (h >= 50) return "You are presentable.";
			if (h >= 25) return "You are grubby.";
			return "You are filthy.";
		}
		if (stat === "hunger") {
			const h = stats.hunger;
			if (h >= 80) return "You are full.";
			if (h >= 50) return "You are satisfied.";
			if (h >= 25) return "You are hungry.";
			return "You are starving.";
		}
		return "";
	}

	/**
	 * Severity class for sidebar colouring (0–4).
	 */
	function severity(stat, variables) {
		const stats = ensure(variables);
		const ratio = value => {
			if (stat === "energy" || stat === "hygiene" || stat === "hunger") {
				return 1 - value / PERCENT_MAX;
			}
			if (stat === "pain") return value / PAIN_MAX;
			if (stat === "arousal" || stat === "stress" || stat === "control") return value / AROUSAL_MAX;
			return 0;
		};
		let r;
		if (stat === "energy") r = ratio(energy(variables));
		else r = ratio(Number(stats[stat]) || 0);
		if (r <= 0.05) return 0;
		if (r < 0.25) return 1;
		if (r < 0.5) return 2;
		if (r < 0.75) return 3;
		return 4;
	}

	/**
	 * Meter fill 0–100 for the sidebar progress rule under a stat.
	 */
	function fillPercent(stat, variables) {
		const stats = ensure(variables);
		if (stat === "energy") return Math.max(0, Math.min(100, energy(variables)));
		if (stat === "pain") return Math.max(0, Math.min(100, Math.round((stats.pain / PAIN_MAX) * 100)));
		if (stat === "arousal" || stat === "stress" || stat === "control") {
			return Math.max(0, Math.min(100, Math.round(((Number(stats[stat]) || 0) / AROUSAL_MAX) * 100)));
		}
		if (stat === "hygiene" || stat === "hunger") {
			return Math.max(0, Math.min(100, Math.round(Number(stats[stat]) || 0)));
		}
		return 0;
	}

	/**
	 * HTML line for the sidebar Current Condition
	 */
	function hudLine(stat, variables) {
		const sev = severity(stat, variables);
		const text = describe(stat, variables);
		const label = LABELS[stat] || stat;
		const fill = fillPercent(stat, variables);
		return (
			`<div class="hud-stat">` +
			`<span class="hud-stat-name">${label}:</span> ` +
			`<span class="hud-stat-text severity${sev}">${text}</span>` +
			`<div class="hud-stat-bar" role="presentation" aria-hidden="true">` +
			`<div class="hud-stat-bar-fill severity${sev}" style="width:${fill}%"></div>` +
			`</div>` +
			`</div>`
		);
	}

	/**
	 * Snapshot for UI: includes computed energy.
	 */
	function snapshot(variables) {
		const stats = ensure(variables);
		return {
			energy: energy(variables),
			fatigue: stats.fatigue,
			arousal: stats.arousal,
			pain: stats.pain,
			stress: stats.stress,
			control: stats.control,
			hygiene: stats.hygiene,
			hunger: stats.hunger,
		};
	}

	Object.assign(Stats, {
		FATIGUE_MAX,
		AROUSAL_MAX,
		PAIN_MAX,
		STRESS_MAX,
		CONTROL_MAX,
		TIERS,
		LABELS,
		createDefaults,
		ensure,
		energy,
		setEnergy,
		energyToFatigue,
		fatigueToEnergy,
		passiveDecay,
		sleepEffects,
		isExhausted,
		parseTier,
		effectMarkup,
		applyEffect,
		effectsMarkup,
		applyEffects,
		describe,
		severity,
		fillPercent,
		hudLine,
		snapshot,
		clampAll,
	});
})();
