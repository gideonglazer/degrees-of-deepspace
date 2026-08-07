/**
 * Pronoun, honorific, and gendered-word helpers for the player and love interests.
 *
 * Gender buckets:
 *   male / transMasc → he/him/his + Mr.
 *   female / transFemme → she/her/hers + Ms.
 *   nonbinary / fluid → they/them/their(s) + Mx. (plural verb agreement)
 *
 * Set the active subject with <<pronouns "xavier">> (or <<pronouns "player">>),
 * then <<he>> / <<him>> / <<his>> / <<gendered>> follow that character's gender.
 *
 * Write verbs normally ("<<he>> isn't", "<<he>> asks", "he's happy"). After the passage
 * renders, fixAgreementIn() corrects singular-they agreement automatically.
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

	/** Always-wrong after "they"; map to the plural-verb form. */
	const THEY_VERB_MAP = {
		is: "are",
		"isn't": "aren't",
		"isn’t": "aren’t",
		was: "were",
		"wasn't": "weren't",
		"wasn’t": "weren’t",
		has: "have",
		"hasn't": "haven't",
		"hasn’t": "haven’t",
		does: "do",
		"doesn't": "don't",
		"doesn’t": "don’t",
	};
	
	const THEY_FOLLOW_KEEP_S = new Set(
		[
			"always",
			"sometimes",
			"afterwards",
			"afterward",
			"outwards",
			"inwards",
			"upwards",
			"downwards",
			"forwards",
			"backwards",
			"sideways",
			"anyways",
			"perhaps",
			"various",
			"previous",
			"across",
			"towards",
			"toward",
			"besides",
			"others",
			"themselves",
			"this",
			"thus",
			"as",
			"yes",
			"ours",
			"yours",
			"theirs",
			"his",
			"hers",
			"its",
			"series",
			"species",
			"news",
			"means",
			"glasses",
			"pants",
			"scissors",
			"clothes",
			"thanks",
		].map(w => w.toLowerCase())
	);

	function bucket(gender) {
		const g = String(gender || "");
		if (g === "male" || g === "transMasc") return "masc";
		if (g === "female" || g === "transFemme") return "femme";
		return "neutral";
	}

	function tableFor(gender) {
		return TABLES[bucket(gender)];
	}

	function playerGender(variables) {
		const vars = variables || V();
		return (vars.player && vars.player.gender) || "female";
	}

	function liGender(liId, variables) {
		const vars = variables || V();
		if (vars.loveInterests && vars.loveInterests[liId] && vars.loveInterests[liId].gender) {
			return vars.loveInterests[liId].gender;
		}
		return "male";
	}

	/**
	 * Who <<he>> / <<him>> / <<his>> currently refer to: "player" or an LI id.
	 */
	function focus(variables) {
		const vars = variables || V();
		return vars.pronounFocus || "player";
	}

	function setFocus(who, variables) {
		const vars = variables || V();
		const id = String(who || "player").trim() || "player";
		vars.pronounFocus = id;
		return id;
	}

	function usePlayer(variables) {
		return setFocus("player", variables);
	}

	/**
	 * Gender string for the active pronoun subject.
	 */
	function activeGender(variables) {
		const who = focus(variables);
		if (!who || who === "player") return playerGender(variables);
		return liGender(who, variables);
	}

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
	 */
	function activeForm(formName, capitalise, variables) {
		return form(formName, activeGender(variables), capitalise);
	}

	/**
	 * Player honorific only (Mr./Ms./Mx. Hunter), ignores NPC focus.
	 */
	function honorific(variables) {
		return form("honorific", playerGender(variables), false);
	}

	/**
	 * Picks masc / femme / neutral wording for a gender.
	 */
	function gendered(gender, masc, femme, neutral) {
		const b = bucket(gender);
		if (b === "masc") return masc;
		if (b === "femme") return femme;
		return neutral;
	}

	/**
	 * Gendered wording for the active pronoun focus.
	 */
	function activeGendered(masc, femme, neutral, variables) {
		return gendered(activeGender(variables), masc, femme, neutral);
	}

	/**
	 * Singular they (and any future plural-pronoun buckets) take plural verbs.
	 */
	function usesPluralVerb(gender) {
		return bucket(gender) === "neutral";
	}

	function verb(singular, plural, gender) {
		return usesPluralVerb(gender) ? plural : singular;
	}

	function activeVerb(singular, plural, variables) {
		return verb(singular, plural, activeGender(variables));
	}

	/**
	 * Verb ending helper: walk<<s>> → "s" / "" ; go<<es>> → "es" / "".
	 */
	function ending(singularEnding, pluralEnding, gender) {
		return usesPluralVerb(gender) ? pluralEnding || "" : singularEnding;
	}

	function activeEnding(singularEnding, pluralEnding, variables) {
		return ending(singularEnding, pluralEnding, activeGender(variables));
	}

	/**
	 * Subject + be contraction: he's / she's / they're.
	 */
	function subjectBeContraction(gender, capitalise) {
		const b = bucket(gender);
		let value = b === "masc" ? "he's" : b === "femme" ? "she's" : "they're";
		if (capitalise) {
			value = value.charAt(0).toUpperCase() + value.slice(1);
		}
		return value;
	}

	function activeSubjectBeContraction(capitalise, variables) {
		return subjectBeContraction(activeGender(variables), capitalise);
	}

	function matchCase(word, replacement) {
		if (!word) return replacement;
		if (word === word.toUpperCase()) return replacement.toUpperCase();
		if (word.charAt(0) === word.charAt(0).toUpperCase()) {
			return replacement.charAt(0).toUpperCase() + replacement.slice(1);
		}
		return replacement;
	}

	/**
	 * Best-effort 3sg → base present: asks→ask, goes→go, tries→try, watches→watch.
	 */
	function pluralizePresentVerb(word) {
		const lower = word.toLowerCase();
		if (THEY_FOLLOW_KEEP_S.has(lower)) return null;
		if (THEY_VERB_MAP[lower]) return matchCase(word, THEY_VERB_MAP[lower]);

		if (lower.length < 2 || !/[sS]$/.test(word)) return null;

		// tries → try
		if (/[bcdfghjklmnpqrstvwxyz]ies$/i.test(lower) && lower.length > 4) {
			return matchCase(word, lower.slice(0, -3) + "y");
		}
		// goes → go ; watches/wishes/buzzes/boxes → watch/wish/buzz/box
		if (/(?:oes|[xz]es|ches|shes|sses|zzes)$/i.test(lower)) {
			return matchCase(word, lower.slice(0, -2));
		}
		// plain -s, but not -ss / -us / -is stems (status, this, bliss)
		if (/s$/i.test(lower) && !/(?:ss|us|is)$/i.test(lower)) {
			return matchCase(word, lower.slice(0, -1));
		}
		return null;
	}

	/**
	 * Correct ungrammatical "they" + singular-verb sequences in plain text.
	 * Safe regardless of pronoun focus ("they isn't" is always wrong here).
	 */
	function fixTheyVerbs(text) {
		return String(text || "").replace(/\b([Tt]hey)\s+([A-Za-z][A-Za-z’']*)/g, (full, they, word) => {
			const fixed = pluralizePresentVerb(word);
			return fixed ? `${they} ${fixed}` : full;
		});
	}

	/**
	 * When the active focus uses singular they, rewrite narrative he's/she's → they're.
	 * Skips text inside double quotes so dialogue about someone else is preserved.
	 */
	function fixSubjectBeContractions(text, variables) {
		if (!usesPluralVerb(activeGender(variables))) return String(text || "");
		const source = String(text || "");
		const parts = source.split(/(["“”])/);
		let inQuote = false;
		return parts
			.map(part => {
				if (part === '"' || part === "“" || part === "”") {
					inQuote = part === '"' ? !inQuote : part === "“" ? true : part === "”" ? false : inQuote;
					return part;
				}
				if (inQuote) return part;
				return part
					.replace(/\bhe's\b/gi, m => matchCase(m, "they're"))
					.replace(/\bhe’s\b/gi, m => matchCase(m, "they’re"))
					.replace(/\bshe's\b/gi, m => matchCase(m, "they're"))
					.replace(/\bshe’s\b/gi, m => matchCase(m, "they’re"));
			})
			.join("");
	}

	function fixAgreement(text, variables) {
		return fixSubjectBeContractions(fixTheyVerbs(text), variables);
	}

	/**
	 * Walk text nodes under a rendered passage root and apply agreement fixes.
	 */
	function fixAgreementIn(root, variables) {
		if (!root) return;
		// Merge adjacent text nodes so "<<he>> isn't" is one string ("they isn't").
		if (typeof root.normalize === "function") root.normalize();
		const doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
		if (!doc || typeof doc.createTreeWalker !== "function") return;
		const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
		const nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		nodes.forEach(node => {
			const value = node.nodeValue;
			if (!value || !/[A-Za-z]/.test(value)) return;
			const next = fixAgreement(value, variables);
			if (next !== value) node.nodeValue = next;
		});
	}

	function installPassageHook() {
		if (typeof jQuery === "undefined") return;
		jQuery(document).on(":passagerender", function (ev) {
			fixAgreementIn(ev.content);
		});
	}

	if (typeof jQuery !== "undefined") {
		installPassageHook();
	} else if (typeof document !== "undefined") {
		document.addEventListener("DOMContentLoaded", installPassageHook);
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
		usesPluralVerb,
		verb,
		activeVerb,
		ending,
		activeEnding,
		subjectBeContraction,
		activeSubjectBeContraction,
		fixTheyVerbs,
		fixSubjectBeContractions,
		fixAgreement,
		fixAgreementIn,
	});
})();
