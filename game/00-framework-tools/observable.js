/**
 * A value that notifies subscribers when it changes.
 *
 * Used for UI state that is not part of the save — the current theme, whether a panel is expanded —
 * where the alternative is either a story variable (which would bloat every history state) or a
 * manual redraw call at every mutation site.
 */

(function () {
	"use strict";

	class ObservableValue {
		constructor(initial) {
			this._value = initial;
			this._listeners = [];
		}

		get value() {
			return this._value;
		}

		set value(next) {
			if (next === this._value) return;
			const previous = this._value;
			this._value = next;
			this._listeners.forEach(listener => Errors.guard("ObservableValue listener", () => listener(next, previous)));
		}

		/**
		 * Subscribes to changes.
		 */
		subscribe(listener, immediate) {
			this._listeners.push(listener);
			if (immediate) Errors.guard("ObservableValue listener", () => listener(this._value, undefined));
			return () => {
				this._listeners = this._listeners.filter(entry => entry !== listener);
			};
		}
	}

	window.ObservableValue = ObservableValue;
})();
