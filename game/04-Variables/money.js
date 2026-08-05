/**
 * Currency formatting. Amounts live on $money; the symbol comes from $options.currency.
 */

defineGlobalNamespaces("Money");

(function () {
	"use strict";

	const SYMBOLS = ["$", "£", "€", "¥", "₩", "₽", "₹", "元"];

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
	 * @param {number} delta
	 * @param {object} [variables]
	 * @returns {number}
	 */
	function add(delta, variables) {
		const vars = variables || V();
		if (vars.money === undefined) vars.money = 0;
		vars.money = Math.round(Number(vars.money) || 0) + Math.round(Number(delta) || 0);
		return vars.money;
	}

	/**
	 * @param {object} [variables]
	 * @returns {number}
	 */
	function get(variables) {
		const vars = variables || V();
		if (vars.money === undefined) vars.money = 0;
		return Math.round(Number(vars.money) || 0);
	}

	Object.assign(Money, { SYMBOLS, symbols, symbol, format, add, get });
})();
