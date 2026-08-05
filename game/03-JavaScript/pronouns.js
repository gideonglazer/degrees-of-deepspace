/**
 * Pronoun, honorific, and gendered-word helpers for the player and love interests.
 *
 * Gender buckets:
 *   male / transMasc → he/him/his + Mr.
 *   female / transFemme → she/her/hers + Ms.
 *   nonbinary / fluid → they/them/their(s) + Mx.
 *
 * Set the active subject with <<pronouns "xavier">> (or <<pronouns "player">>),
 * then <<he>> / <<him>> / <<his>> / <<gendered>> follow that character's gender.
 */

defineGlobalNamespaces("Pronouns");

(function () {
	"use strict";

	const TABLES = {
		masc: {
			subject: "he",
			object: "him",
			possessive: "his",
			possessiveNoun: "his",
			reflexive: "himself",
			honorific: "Mr.",
		},
		femme: {
			subject: "she",
			object: "her",
			possessive: "her",
			possessiveNoun: "hers",
			reflexive: "herself",
			honorific: "Ms.",
		},
		neutral: {
			subject: "they",
			object: "them",
			possessive: "their",
			possessiveNoun: "theirs",
			reflexive: "themself",
			honorific: "Mx.",
		},
	};

	/**
	 * @param {string} gender
	 * @returns {"masc"|"femme"|"neutral"}
	 */
	function bucket(gender) {
		const g = String(gender || "");
		if (g === "male" || g === "transMasc") return "masc";
		if (g === "female" || g === "transFemme") return "femme";
		return "neutral";
	}

	/**
	 * @param {string} gender
	 * @returns {object}
	 */
	function tableFor(gender) {
		return TABLES[bucket(gender)];
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function playerGender(variables) {
		const vars = variables || V();
		return (vars.player && vars.player.gender) || "female";
	}

	/**
	 * @param {string} liId
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function liGender(liId, variables) {
		const vars = variables || V();
		if (vars.loveInterests && vars.loveInterests[liId] && vars.loveInterests[liId].gender) {
			return vars.loveInterests[liId].gender;
		}
		return "male";
	}

	/**
	 * Who <<he>> / <<him>> / <<his>> currently refer to: "player" or an LI id.
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function focus(variables) {
		const vars = variables || V();
		return vars.pronounFocus || "player";
	}

	/**
	 * @param {string} who "player" or love-interest id
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function setFocus(who, variables) {
		const vars = variables || V();
		const id = String(who || "player").trim() || "player";
		vars.pronounFocus = id;
		return id;
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function usePlayer(variables) {
		return setFocus("player", variables);
	}

	/**
	 * Gender string for the active pronoun subject.
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function activeGender(variables) {
		const who = focus(variables);
		if (!who || who === "player") return playerGender(variables);
		return liGender(who, variables);
	}

	/**
	 * @param {string} formName subject|object|possessive|possessiveNoun|reflexive|honorific
	 * @param {string} gender
	 * @param {boolean} [capitalise]
	 * @returns {string}
	 */
	function form(formName, gender, capitalise) {
		const table = tableFor(gender);
		let value = table[formName] || "";
		if (capitalise && value) {
			value = value.charAt(0).toUpperCase() + value.slice(1);
		}
		return value;
	}

	/**
	 * Pronoun for the active focus (after <<pronouns …>>).
	 *
	 * @param {string} formName
	 * @param {boolean} [capitalise]
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function activeForm(formName, capitalise, variables) {
		return form(formName, activeGender(variables), capitalise);
	}

	/**
	 * Player honorific only (Mr./Ms./Mx. Hunter), ignores NPC focus.
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function honorific(variables) {
		return form("honorific", playerGender(variables), false);
	}

	/**
	 * Picks masc / femme / neutral wording for a gender.
	 *
	 * @param {string} gender
	 * @param {string} masc
	 * @param {string} femme
	 * @param {string} neutral
	 * @returns {string}
	 */
	function gendered(gender, masc, femme, neutral) {
		const b = bucket(gender);
		if (b === "masc") return masc;
		if (b === "femme") return femme;
		return neutral;
	}

	/**
	 * Gendered wording for the active pronoun focus.
	 *
	 * @param {string} masc
	 * @param {string} femme
	 * @param {string} neutral
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function activeGendered(masc, femme, neutral, variables) {
		return gendered(activeGender(variables), masc, femme, neutral);
	}

	Object.assign(Pronouns, {
		TABLES,
		bucket,
		tableFor,
		playerGender,
		liGender,
		focus,
		setFocus,
		usePlayer,
		activeGender,
		form,
		activeForm,
		honorific,
		gendered,
		activeGendered,
	});
})();
