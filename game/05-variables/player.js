/**
 * Player appearance helpers. Defaults live in Constants.character.defaults; story state is $player.
 */

defineGlobalNamespaces("Player");

(function () {
	"use strict";

	/**
	 * Fresh cosmetics object matching the character creator fields.
	 */
	function createDefaults() {
		return clone(C().character.defaults);
	}

	/**
	 * Ensures `$player` exists with every cosmetics field. Safe to call on Start and after loads.
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
		if (vars.player.heterochromia && vars.player.eyeColorLeft === vars.player.eyeColorRight) {
			vars.player.eyeColorRight = otherEyeColor(vars.player.eyeColorLeft);
		}
		return vars.player;
	}

	/**
	 * Picks a random catalogue value from Constants.character[listKey].
	 */
	function pickCatalogue(listKey) {
		const options = C().character[listKey];
		const entry = pickRandomItemInArray(options);
		return entry ? entry.value : undefined;
	}

	/**
	 * Another eye-colour catalogue value, used so heterochromia never matches.
	 */
	function otherEyeColor(exceptValue) {
		const options = (C().character && C().character.eyeColors) || [];
		if (!options.length) return exceptValue;
		const index = options.findIndex(entry => entry.value === exceptValue);
		const next = options[(Math.max(index, 0) + 1) % options.length];
		if (next && next.value !== exceptValue) return next.value;
		const found = options.find(entry => entry.value !== exceptValue);
		return found ? found.value : exceptValue;
	}

	/**
	 * Overwrites `$player` cosmetics with a random pick from each character catalogue.
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
			player.eyeColorRight = otherEyeColor(player.eyeColorLeft);
			player.eyeColor = player.eyeColorLeft;
		} else {
			player.eyeColorLeft = eyeColor;
			player.eyeColorRight = eyeColor;
		}

		return player;
	}

	/**
	 * Resets `$player` cosmetics to Constants.character.defaults.
	 */
	function resetToDefaults(variables) {
		const vars = variables || V();
		vars.player = createDefaults();
		return vars.player;
	}

	function age(variables) {
		const player = ensure(variables);
		return player.age === "younger" ? "younger" : "older";
	}

	function isYounger(variables) {
		return age(variables) === "younger";
	}

	function isOlder(variables) {
		return age(variables) === "older";
	}

	/**
	 * Picks a short phrase by player age.
	 */
	function aged(youngerText, olderText, variables) {
		return isYounger(variables) ? String(youngerText || "") : String(olderText || "");
	}

	function catalogueEntry(listKey, value) {
		const options = (C().character && C().character[listKey]) || [];
		return options.find(entry => entry.value === value) || null;
	}

	function catalogueLabel(listKey, value) {
		const entry = catalogueEntry(listKey, value);
		return entry && entry.label ? entry.label : String(value || "");
	}

	function lowerLabel(listKey, value) {
		return catalogueLabel(listKey, value).toLowerCase();
	}

	function toneClass(tone) {
		if (tone === "femme") return "cc-tone-femme";
		if (tone === "masc") return "cc-tone-masc";
		return "cc-tone-neutral";
	}

	function toneWrap(tone, text) {
		return `<span class="${toneClass(tone)}">${Utils.escapeHtml(text)}</span>`;
	}

	function swatchWrap(listKey, value, text) {
		const entry = catalogueEntry(listKey, value);
		const display = Utils.escapeHtml(text != null ? text : lowerLabel(listKey, value));
		if (entry && entry.color) {
			return `<span class="cc-swatch" style="color:${Utils.escapeHtml(entry.color)}">${display}</span>`;
		}
		return display;
	}

	function genderPhrase(player) {
		const entry = catalogueEntry("genders", player.gender);
		const label = lowerLabel("genders", player.gender);
		return toneWrap((entry && entry.tone) || "neutral", label);
	}

	function clothingPhrase(player) {
		const entry = catalogueEntry("clothingPrefs", player.clothingPref);
		const label = lowerLabel("clothingPrefs", player.clothingPref);
		return toneWrap((entry && entry.tone) || "neutral", label);
	}

	function heightPhrase(player) {
		if (player.height === "average") return "average height";
		if (player.height === "veryTall") return "very tall";
		return lowerLabel("heights", player.height);
	}

	function selfParagraph(player) {
		const age = lowerLabel("ages", player.age);
		const height = heightPhrase(player);
		const voice = lowerLabel("vocalTones", player.vocalTone);
		return (
			`I'm a ${Utils.escapeHtml(height)}, ${Utils.escapeHtml(age)} ${genderPhrase(player)}. ` +
			`I prefer ${clothingPhrase(player)} clothing, and my voice is ${Utils.escapeHtml(voice)}.`
		);
	}

	function hairParagraph(player) {
		const hair = player.hair || {};
		const length = lowerLabel("hairLengths", hair.length);
		const style = lowerLabel("hairStyles", hair.style);
		const type = lowerLabel("hairTypes", hair.type);
		const color = swatchWrap("hairColors", hair.color);
		return (
			`I have ${Utils.escapeHtml(length)}, ${Utils.escapeHtml(type)}, ${color} hair ` +
			`that is usually styled as ${Utils.escapeHtml(style)}.`
		);
	}

	function eyesParagraph(player) {
		const shape = lowerLabel("eyeShapes", player.eyeShape);
		if (player.heterochromia) {
			const left = swatchWrap("eyeColors", player.eyeColorLeft);
			const right = swatchWrap("eyeColors", player.eyeColorRight);
			return (
				`My eyes are ${Utils.escapeHtml(shape)}, and I have heterochromia — ` +
				`my left eye is ${left}, while the right eye is ${right}.`
			);
		}
		const color = player.eyeColor || player.eyeColorLeft;
		return `My eyes are ${Utils.escapeHtml(shape)} shaped and ${swatchWrap("eyeColors", color)} in color.`;
	}

	function bodyParagraph(player) {
		const face = lowerLabel("faceShapes", player.faceShape);
		const body = lowerLabel("bodyShapes", player.bodyShape);
		const skin = swatchWrap("skinTones", player.skinTone);
		const freckles = player.freckles ? "I have freckles." : "I don't have freckles.";
		return (
			`I have a ${Utils.escapeHtml(face)} face, ${Utils.escapeHtml(body)} body, ` +
			`and ${skin} skin. ${freckles}`
		);
	}

	/**
	 * First-person summary of every character-creator field currently on $player.
	 */
	function aboutMeMarkup(variables) {
		const vars = variables || V();
		const player = ensure(vars);
		return (
			`<div class="about-me-body">` +
			`<p>${selfParagraph(player)} ${hairParagraph(player)} ${eyesParagraph(player)} ${bodyParagraph(player)}</p>` +
			`</div>`
		);
	}

	Object.assign(Player, {
		createDefaults,
		ensure,
		randomize,
		resetToDefaults,
		age,
		isYounger,
		isOlder,
		aged,
		aboutMeMarkup,
		otherEyeColor,
	});
})();
