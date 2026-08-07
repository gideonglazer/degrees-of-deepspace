/**
 * Social modal
 */

defineGlobalNamespaces("Social");

(function () {
	"use strict";

	/**
	 * Inline SVG glyph for a relationship stat.
	 *
	 * @param {string} key
	 * @param {number} value 0–100
	 * @returns {string}
	 */
	function statIcon(key, value) {
		const filled = value >= 50;
		const cls = `social-stat-icon social-stat-icon-${key}${filled ? " is-filled" : ""}`;
		switch (key) {
			case "love":
				return (
					`<span class="${cls}" aria-hidden="true">` +
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
					`<path d="M8 13.5S2.5 9.8 2.5 5.8A3.1 3.1 0 0 1 8 4.2 3.1 3.1 0 0 1 13.5 5.8C13.5 9.8 8 13.5 8 13.5z" ` +
					`fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.25"/>` +
					`</svg></span>`
				);
			case "longing":
				return (
					`<span class="${cls}" aria-hidden="true">` +
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
					`<path d="M5.5 2.5h5v2.2c0 .6.2 1.1.6 1.5L13 8.2v5.3H3V8.2l1.9-2c.4-.4.6-.9.6-1.5V2.5z" ` +
					`fill="none" stroke="currentColor" stroke-width="1.2"/>` +
					`<path d="M5.5 2.5h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>` +
					`<path d="M4.2 13.5h7.6V9.2C9.8 10.4 6.2 10.4 4.2 9.2v4.3z" fill="currentColor" opacity="${Math.max(0.15, value / 100)}"/>` +
					`</svg></span>`
				);
			case "dominance":
				return (
					`<span class="${cls}" aria-hidden="true">` +
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
					`<circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" stroke-width="1.25"/>` +
					`<circle cx="8" cy="8" r="2.1" fill="currentColor"/>` +
					`</svg></span>`
				);
			case "jealousy":
				return (
					`<span class="${cls}" aria-hidden="true">` +
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
					`<path d="M1.8 8s2.4-4.2 6.2-4.2S14.2 8 14.2 8s-2.4 4.2-6.2 4.2S1.8 8 1.8 8z" ` +
					`fill="none" stroke="currentColor" stroke-width="1.2"/>` +
					`<circle cx="8" cy="8" r="2" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.2"/>` +
					`</svg></span>`
				);
			case "loyalty":
				return (
					`<span class="${cls}" aria-hidden="true">` +
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
					`<path d="M8 2.4l1.5 3.1 3.4.5-2.5 2.4.6 3.4L8 10.2l-3 1.6.6-3.4-2.5-2.4 3.4-.5L8 2.4z" ` +
					`fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>` +
					`</svg></span>`
				);
			default:
				return `<span class="${cls}" aria-hidden="true">◆</span>`;
		}
	}

	/**
	 * Coloured keyword helper.
	 *
	 * @param {string} colour CSS colour class (pink, green, …)
	 * @param {string} text
	 * @returns {string}
	 */
	function tint(colour, text) {
		return `<span class="${colour}">${text}</span>`;
	}

	/**
	 * Subjective pronoun for an LI (he/she/they), lowercase.
	 *
	 * @param {string} id
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function subjectPronoun(id, variables) {
		if (typeof Pronouns === "undefined") return "they";
		return Pronouns.form("subject", Pronouns.liGender(id, variables), false) || "they";
	}

	/**
	 * Possessive pronoun (his/her/their).
	 *
	 * @param {string} id
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function possessivePronoun(id, variables) {
		if (typeof Pronouns === "undefined") return "their";
		return Pronouns.form("possessive", Pronouns.liGender(id, variables), false) || "their";
	}

	/**
	 * Status sentence for a met love interest.
	 *
	 * @param {string} id
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function statusMarkup(id, variables) {
		const vars = variables || V();
		LoveInterests.ensure(vars);
		const name = LoveInterests.displayName(id, vars);
		if (!name) return "";

		const love = LoveInterests.getStat(id, "love", vars);
		const longing = LoveInterests.getStat(id, "longing", vars);
		const dominance = LoveInterests.statsFor(id).includes("dominance")
			? LoveInterests.getStat(id, "dominance", vars)
			: 0;
		const loyalty = LoveInterests.statsFor(id).includes("loyalty")
			? LoveInterests.getStat(id, "loyalty", vars)
			: 0;
		const jealousy = LoveInterests.statsFor(id).includes("jealousy")
			? LoveInterests.getStat(id, "jealousy", vars)
			: 0;
		const their = possessivePronoun(id, vars);

		/* Unique-stat flavours take priority when elevated. */
		if (jealousy >= 70 && love >= 40) {
			return `${name}'s ${tint("orange", "jealousy")} flares whenever others get close to you.`;
		}
		if (dominance >= 70) {
			return `${name} keeps you on a ${tint("red", "tighter leash")}.`;
		}
		if (loyalty >= 80) {
			return `${name}'s ${tint("green", "loyalty")} to you runs bone-deep.`;
		}
		if (longing >= 75 && love >= 40) {
			return `${name} ${tint("pink", "aches")} for you when you're apart.`;
		}

		if (love >= 95) return `${name} ${tint("pink", "cherishes")} you.`;
		if (love >= 80) return `${name} is ${tint("pink", "devoted")} to you.`;
		if (love >= 65) return `${name} ${tint("pink", "adores")} you.`;
		if (love >= 50) return `${name} ${tint("green", "cares deeply")} for you.`;
		if (love >= 35) return `${name} ${tint("green", "likes")} you.`;
		if (love >= 20) return `${name} is ${tint("blue", "warming up")} to you.`;
		if (love >= 8) return `${name} is ${tint("teal", "beginning to trust")} you.`;
		if (longing >= 20) {
			return `Thoughts of you linger in the ${tint("blue", "back of " + their + " mind")}.`;
		}
		return `${name} has ${tint("silver", "no strong opinion")} of you.`;
	}

	/**
	 * HTML for one relationship card.
	 *
	 * @param {string} id
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function cardMarkup(id, variables) {
		const vars = variables || V();
		LoveInterests.ensure(vars);
		const name = LoveInterests.displayName(id, vars);
		const epithet = LoveInterests.displayEpithet(id);
		const stats = LoveInterests.statsFor(id)
			.map(key => ({ key, value: LoveInterests.getStat(id, key, vars) }))
			.filter(stat => stat.value > 0);

		const statCells = stats
			.map(({ key, value }) => {
				const label = LoveInterests.statLabel(key);
				return (
					`<div class="social-stat">` +
					`<div class="social-stat-label">${label}</div>` +
					`<div class="social-stat-value">${statIcon(key, value)}` +
					`<span class="social-stat-pct">${value}%</span></div>` +
					`</div>`
				);
			})
			.join("");

		const statsClass =
			"social-card-stats" + (stats.length === 1 ? " social-card-stats--single" : "");

		return (
			`<div class="social-card" data-li="${id}">` +
			`<div class="social-card-header">` +
			`<span class="social-card-name">${name}</span>` +
			(epithet ? `<span class="social-card-title">${epithet}</span>` : "") +
			`</div>` +
			`<div class="social-card-status">${statusMarkup(id, vars)}</div>` +
			(stats.length ? `<div class="${statsClass}">${statCells}</div>` : "") +
			`</div>`
		);
	}

	/**
	 * Opens the Social modal (Primary Relationships).
	 */
	function openDialog() {
		LoveInterests.ensure();
		Flags.ensure();
		Dialog.setup("Social", "social-dialog");
		Dialog.wiki("<<socialContents>>");
		Dialog.open();
	}

	Object.assign(Social, {
		statIcon,
		statusMarkup,
		cardMarkup,
		openDialog,
	});
})();
