module.exports = {
	plugins: ["stylelint-no-unsupported-browser-features"],
	extends: ["stylelint-config-standard", "stylelint-config-property-sort-order-smacss", "stylelint-prettier/recommended"],
	ignoreFiles: ["node_modules/**", "devTools/**", "dist/**"],
	rules: {
		"plugin/no-unsupported-browser-features": [
			true,
			{
				severity: "warning",
				// background-clip: keeps stylelint from removing -webkit-background-clip
				// css3-cursors: only used for cursor: not-allowed, which degrades to the default cursor
				ignore: ["background-clip", "css3-cursors"],
			},
		],

		// Class and ID patterns disabled to match the naming already used across passages
		"selector-class-pattern": null,
		"selector-id-pattern": null,

		/* Because we don't use PostCSS, these errors seem redundant. */
		"media-feature-name-no-vendor-prefix": null,
		"property-no-vendor-prefix": null,
		"value-no-vendor-prefix": null,

		/* Stylistic errors that aren't useful. */
		"order/properties-order": null,
		"comment-empty-line-before": null,

		// Modified kebab-case for numbered CSS vars
		"custom-property-pattern": [
			"^([a-z0-9]*)(-[a-z0-9]+)*$",
			{
				message: "Expected custom property name to be kebab-case",
			},
		],
	},
	overrides: [
		{
			files: ["modules/css/base.css"],
			rules: {
				"font-family-no-missing-generic-family-keyword": null,
				"no-descending-specificity": null,
				"selector-type-no-unknown": null,
			},
		},
	],
};
