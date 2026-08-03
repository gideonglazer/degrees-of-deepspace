/**
 * Wrappers around Macro.add that cut the boilerplate and route failures through Errors.
 *
 * A macro that throws normally aborts rendering mid-passage, leaving a half-drawn screen. These
 * wrappers catch instead, so the rest of the passage still renders and the problem shows up in the
 * error report.
 */

(function () {
	"use strict";

	/**
	 * Defines a macro whose handler writes into `this.output`.
	 *
	 * @param {string|string[]} name Macro name, or [name, ...aliases].
	 * @param {Function} handler Receives (args, macroContext) with `this` bound to the context.
	 * @param {object} [options] Extra Macro.add options, e.g. { tags: [] } for a container macro.
	 */
	function DefineMacro(name, handler, options) {
		const names = ensureIsArray(name);
		Macro.add(names, {
			skipArgs: false,
			...options,
			handler() {
				try {
					handler.call(this, this.args, this);
				} catch (err) {
					Errors.report(err, `<<${names[0]}>>`);
					this.error(err.message);
				}
			},
		});
	}

	/**
	 * Defines a macro that prints whatever its handler returns. For the common case of a macro that
	 * produces a string of markup.
	 *
	 * @param {string|string[]} name
	 * @param {Function} handler Receives (args, macroContext); return a string of markup, or nothing.
	 * @param {object} [options]
	 */
	function DefineMacroS(name, handler, options) {
		DefineMacro(
			name,
			function (args, context) {
				const result = handler.call(this, args, context);
				if (result === undefined || result === null || result === "") return;
				$(this.output).wiki(String(result));
			},
			options
		);
	}

	Object.assign(window, { DefineMacro, DefineMacroS });
})();
