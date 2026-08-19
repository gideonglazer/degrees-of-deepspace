/**
 * Love-interest roster and relationship-stat tables. Engine: LoveInterests.
 */

(function () {
	"use strict";

	/** Locale codes shown in the Display Name radios, in UI order. */
	const NAME_LOCALES = [
		{ value: "en", code: "EN" },
		{ value: "cn", code: "CN" },
		{ value: "jp", code: "JP" },
		{ value: "kr", code: "KR" },
	];

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
			entry("zayne", "the Cardiac Surgeon", {
				en: "Zayne",
				cn: "Li Shen",
				jp: "Rei",
				kr: "Lee Seoeon",
			}),
		],

		/**
		 * Relationship stats shared by every love interest.
		 * Unique extras are listed under uniqueStats by id (Seiya = Xavier).
		 */
		universalStats: ["affinity", "longing"],

		/** Per-character extras beyond the universal stats. */
		uniqueStats: {
			sylus: ["vulnerability", "dominance"],
			gideon: ["confidence"],
			caleb: ["jealousy", "dominance"],
			valko: ["loyalty"],
			xavier: ["devotion"],
			rafayel: ["trust"],
			zayne: ["dominance"],
		},

		statLabels: {
			affinity: "Affinity",
			longing: "Longing",
			vulnerability: "Vulnerability",
			dominance: "Dominance",
			confidence: "Confidence",
			jealousy: "Jealousy",
			loyalty: "Loyalty",
			devotion: "Devotion",
			trust: "Trust",
		},

		/** Cosmetics defaults applied to every love interest until the player customises them. */
		defaults: {
			nameLocale: "en",
			gender: "male",
			height: "tall",
			skinTone: "fair",
			affinity: 0,
			longing: 0,
			hair: {
				length: "short",
				style: "neat",
			},
		},

		/** Affinity / longing / unique-stat change magnitudes for +, ++, +++. */
		affinityTiers: { "+": 1, "++": 2, "+++": 3 },
		affinityMax: 100,
		nameLocales: NAME_LOCALES,
	});
})();
