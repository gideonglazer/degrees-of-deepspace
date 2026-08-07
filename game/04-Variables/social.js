/**
 * Social modal
 */

defineGlobalNamespaces("Social");

(function () {
	"use strict";

	/** Shared unique-stat PNGs under img/ui-icons/ (love uses love-{id}.png). */
	const STAT_ICON_FILES = {
		dominance: "dominance.png",
		jealousy: "jealousy.png",
		loyalty: "loyalty.png",
	};

	function fillPct(value) {
		return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
	}

	/**
	 * Pixel icon with left→right colour reveal.
	 */
	function pngIcon(cls, file, value, baseFile) {
		const fill = fillPct(value);
		const base = baseFile || file;
		return (
			`<span class="${cls}" style="--stat-fill:${fill}%" aria-hidden="true">` +
			`<img class="social-stat-icon-img social-stat-icon-img--base" src="img/ui-icons/${base}" alt="" draggable="false">` +
			`<img class="social-stat-icon-img social-stat-icon-img--fill" src="img/ui-icons/${file}" alt="" draggable="false">` +
			`</span>`
		);
	}

	/**
	 * SVG fallback with the same left→right reveal.
	 */
	function svgIcon(cls, value, svgInner) {
		const fill = fillPct(value);
		return (
			`<span class="${cls}" style="--stat-fill:${fill}%" aria-hidden="true">` +
			`<span class="social-stat-icon-svg social-stat-icon-svg--base">${svgInner}</span>` +
			`<span class="social-stat-icon-svg social-stat-icon-svg--fill">${svgInner}</span>` +
			`</span>`
		);
	}

	/**
	 * Glyph for a relationship stat. Prefers PNG assets; SVG fallback for missing files.
	 */
	function statIcon(key, value, liId) {
		const cls = `social-stat-icon social-stat-icon-${key}`;

		if (key === "love") {
			const safe = String(liId || "")
				.trim()
				.replace(/[^a-zA-Z0-9_-]/g, "");
			if (safe) return pngIcon(cls, `love-${safe}.png`, value);
		}
		if (key === "longing") {
			return pngIcon(cls, "lust.png", value, "lust-empty.png");
		}
		if (STAT_ICON_FILES[key]) {
			return pngIcon(cls, STAT_ICON_FILES[key], value);
		}

		/* Fallback glyphs until PNGs exist for these unique stats. */
		switch (key) {
			case "vulnerability":
				return svgIcon(
					cls,
					value,
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
						`<path d="M8 13.2S3.2 9.8 3.2 6.2A2.8 2.8 0 0 1 8 4.6 2.8 2.8 0 0 1 12.8 6.2C12.8 9.8 8 13.2 8 13.2z" ` +
						`fill="currentColor" stroke="currentColor" stroke-width="1.2"/>` +
						`<path d="M8 5.2v5.2" stroke="var(--bg, #1a1a1a)" stroke-width="1.1" stroke-linecap="round"/>` +
						`</svg>`
				);
			case "confidence":
				return svgIcon(
					cls,
					value,
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
						`<path d="M8 2.8l2.2 4.2H14l-3.4 2.8 1.2 4.2L8 11.4l-3.8 2.6 1.2-4.2L2 7h3.8L8 2.8z" ` +
						`fill="currentColor" stroke="currentColor" stroke-width="1.05" stroke-linejoin="round"/>` +
						`</svg>`
				);
			case "devotion":
				return svgIcon(
					cls,
					value,
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
						`<path d="M8 13.5V7.2" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>` +
						`<path d="M5.2 9.2c0-2.2 1.2-3.6 2.8-4.8C9.6 5.6 10.8 7 10.8 9.2c0 1.4-1.1 2.4-2.8 2.4S5.2 10.6 5.2 9.2z" ` +
						`fill="currentColor" stroke="currentColor" stroke-width="1.15"/>` +
						`</svg>`
				);
			case "trust":
				return svgIcon(
					cls,
					value,
					`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false">` +
						`<path d="M3.2 8.2l2.6 2.6L12.6 4" fill="none" stroke="currentColor" stroke-width="1.35" ` +
						`stroke-linecap="round" stroke-linejoin="round"/>` +
						`<rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.15"/>` +
						`</svg>`
				);
			default:
				return `<span class="${cls}" aria-hidden="true">◆</span>`;
		}
	}

	/**
	 * Coloured keyword helper.
	 */
	function tint(colour, text) {
		return `<span class="${colour}">${text}</span>`;
	}

	/**
	 * Subjective pronoun for an LI (he/she/they), lowercase.
	 */
	function subjectPronoun(id, variables) {
		if (typeof Pronouns === "undefined") return "they";
		return Pronouns.form("subject", Pronouns.liGender(id, variables), false) || "they";
	}

	/**
	 * Possessive pronoun (his/her/their).
	 */
	function possessivePronoun(id, variables) {
		if (typeof Pronouns === "undefined") return "their";
		return Pronouns.form("possessive", Pronouns.liGender(id, variables), false) || "their";
	}

	/**
	 * Status sentence for a met love interest.
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
		const vulnerability = LoveInterests.statsFor(id).includes("vulnerability")
			? LoveInterests.getStat(id, "vulnerability", vars)
			: 0;
		const confidence = LoveInterests.statsFor(id).includes("confidence")
			? LoveInterests.getStat(id, "confidence", vars)
			: 0;
		const devotion = LoveInterests.statsFor(id).includes("devotion")
			? LoveInterests.getStat(id, "devotion", vars)
			: 0;
		const trust = LoveInterests.statsFor(id).includes("trust")
			? LoveInterests.getStat(id, "trust", vars)
			: 0;
		const their = possessivePronoun(id, vars);

		/* Unique-stat flavours take priority when elevated. */
		if (jealousy >= 70 && love >= 40) {
			return `${name}'s ${tint("orange", "is hysterical")}.`;
		}
		if (dominance >= 70) {
			return `${name} ${tint("red", "is in full control")}.`;
		}
		if (vulnerability >= 70) {
			return `${name} lets ${their} ${tint("blue", "guard down")} around you.`;
		}
		if (confidence >= 70) {
			return `${name} radiates quiet ${tint("gold", "confidence")}.`;
		}
		if (devotion >= 70) {
			return `${name}'s ${tint("pink", "devotion")} to you is unmistakable.`;
		}
		if (trust >= 70) {
			return `${name} places complete ${tint("teal", "trust")} in you.`;
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
	 */
	function cardMarkup(id, variables) {
		const vars = variables || V();
		LoveInterests.ensure(vars);
		const name = LoveInterests.displayName(id, vars);
		const epithet = LoveInterests.displayEpithet(id);
		const stats = LoveInterests.statsFor(id)
			.map(key => ({ key, value: LoveInterests.getStat(id, key, vars) }))
			.filter(stat => stat.value > 0);

		const cells = stats.slice(0, 4).map(({ key, value }) => {
			const label = LoveInterests.statLabel(key);
			return (
				`<div class="social-stat">` +
				`<div class="social-stat-label">${label}</div>` +
				`<div class="social-stat-value">${statIcon(key, value, id)}` +
				`<span class="social-stat-pct">${value}%</span></div>` +
				`</div>`
			);
		});
		while (cells.length < 4) {
			cells.push(`<div class="social-stat social-stat--empty" aria-hidden="true"></div>`);
		}

		return (
			`<div class="social-card" data-li="${id}">` +
			`<div class="social-card-header">` +
			`<span class="social-card-name">${name}</span>` +
			(epithet ? `<span class="social-card-title">${epithet}</span>` : "") +
			`</div>` +
			`<div class="social-card-status">${statusMarkup(id, vars)}</div>` +
			`<div class="social-card-stats">${cells.join("")}</div>` +
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
