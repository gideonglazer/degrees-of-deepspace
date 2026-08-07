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
