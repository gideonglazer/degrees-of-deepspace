/**
 * Currency formatting. Amounts live on $money; the symbol comes from $options.currency.
 */

defineGlobalNamespaces("Money");

(function () {
	"use strict";

	const SYMBOLS = ["$", "£", "€", "¥", "₩", "₽", "₹", "元"];
	/** Default starting cash for older PCs. */
	const STARTING = 1000;
	/** Starting cash for younger PCs (student / allowance life). */
	const STARTING_YOUNGER = 15;

	/**
	 * @returns {string[]}
	 */
	function symbols() {
		return SYMBOLS.slice();
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function symbol(variables) {
		const vars = variables || V();
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : null;
		const sym = options && options.currency ? String(options.currency) : "$";
		return SYMBOLS.includes(sym) ? sym : "$";
	}

	/**
	 * @param {number|string} amount
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function format(amount, variables) {
		const n = Number(amount);
		const value = Number.isFinite(n) ? Math.round(n) : 0;
		return `${symbol(variables)}${value}`;
	}

	/**
	 * Starting cash for a new run, based on player age.
	 *
	 * @param {object} [variables]
	 * @returns {number}
	 */
	function startingAmount(variables) {
		if (typeof Player !== "undefined" && Player.isYounger(variables)) return STARTING_YOUNGER;
		return STARTING;
	}

	/**
	 * Ensures $money exists with the starting amount when unset.
	 *
	 * @param {object} [variables]
	 * @returns {number}
	 */
	function ensure(variables) {
		const vars = variables || V();
		if (vars.money === undefined) vars.money = startingAmount(vars);
		return Math.round(Number(vars.money) || 0);
	}

	/**
	 * @param {number} delta
	 * @param {object} [variables]
	 * @returns {number}
	 */
	function add(delta, variables) {
		const vars = variables || V();
		ensure(vars);
		vars.money = Math.round(Number(vars.money) || 0) + Math.round(Number(delta) || 0);
		return vars.money;
	}

	/**
	 * @param {object} [variables]
	 * @returns {number}
	 */
	function get(variables) {
		return ensure(variables);
	}

	Object.assign(Money, {
		SYMBOLS,
		STARTING,
		STARTING_YOUNGER,
		symbols,
		symbol,
		format,
		startingAmount,
		ensure,
		add,
		get,
	});
})();
