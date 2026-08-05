/**
 * World clock, calendar, weather, and location. Display formatters respect $options.
 */

defineGlobalNamespaces("World");

(function () {
	"use strict";

	const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	const WEATHER_TEXT = {
		clear: "clear",
		fair: "fair",
		cloudy: "cloudy",
		overcast: "overcast",
		rain: "rainy",
		storm: "stormy",
		fog: "foggy",
		snow: "snowy",
	};

	const SEASON_STARTS = {
		spring: { month: 3, day: 21, weather: "fair", temperatureC: 16 },
		summer: { month: 6, day: 21, weather: "clear", temperatureC: 26 },
		autumn: { month: 9, day: 21, weather: "cloudy", temperatureC: 14 },
		winter: { month: 12, day: 21, weather: "overcast", temperatureC: 2 },
	};

	const SEASON_IDS = ["spring", "summer", "autumn", "winter"];

	/**
	 * Resolves $options.startingSeason into a concrete season id.
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function resolveStartingSeason(variables) {
		const vars = variables || V();
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { startingSeason: "spring" };
		let season = String(options.startingSeason || "spring");
		if (season === "random") {
			season = SEASON_IDS[getRandomIntInclusive(0, SEASON_IDS.length - 1)];
		}
		if (!SEASON_STARTS[season]) season = "spring";
		return season;
	}

	/**
	 * Applies the creator Starting Season choice to $world (date, weather, temp).
	 *
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function applyStartingSeason(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		const season = resolveStartingSeason(vars);
		const start = SEASON_STARTS[season];
		world.month = start.month;
		world.day = start.day;
		world.weather = start.weather;
		world.temperatureC = start.temperatureC;
		world.hour = 8;
		world.minute = 0;
		return world;
	}

	/**
	 * Fresh calendar for a new run from the character creator.
	 *
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function startNew(variables) {
		const vars = variables || V();
		vars.world = createDefaults();
		applyStartingSeason(vars);
		return vars.world;
	}

	/**
	 * @returns {object}
	 */
	function createDefaults() {
		return {
			year: 2048,
			month: 3,
			day: 21,
			hour: 8,
			minute: 0,
			weather: "fair",
			temperatureC: 16,
			location: "apartment-bedroom",
			locationLabel: "Garden South Street — Apartment",
		};
	}

	/**
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function ensure(variables) {
		const vars = variables || V();
		if (!vars.world || typeof vars.world !== "object") {
			vars.world = createDefaults();
		} else {
			const defaults = createDefaults();
			Object.keys(defaults).forEach(key => {
				if (vars.world[key] === undefined) vars.world[key] = defaults[key];
			});
		}
		if (vars.money === undefined) vars.money = 0;
		return vars.world;
	}

	/**
	 * Days in a month (Gregorian, including leap years).
	 *
	 * @param {number} year
	 * @param {number} month 1–12
	 * @returns {number}
	 */
	function daysInMonth(year, month) {
		return new Date(year, month, 0).getDate();
	}

	/**
	 * @param {object} world
	 * @returns {Date}
	 */
	function toDate(world) {
		return new Date(world.year, world.month - 1, world.day, world.hour, world.minute, 0, 0);
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function weekdayName(variables) {
		const world = ensure(variables);
		return WEEKDAYS[toDate(world).getDay()];
	}

	/**
	 * @param {number} month 1–12
	 * @returns {string}
	 */
	function seasonForMonth(month) {
		if (month >= 3 && month <= 5) return "spring";
		if (month >= 6 && month <= 8) return "summer";
		if (month >= 9 && month <= 11) return "autumn";
		return "winter";
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function season(variables) {
		return seasonForMonth(ensure(variables).month);
	}

	/**
	 * Advances the clock by minutes and applies passive stat decay.
	 *
	 * @param {number} minutes
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function advance(minutes, variables) {
		const vars = variables || V();
		const world = ensure(vars);
		const amount = Math.max(0, Math.floor(Number(minutes) || 0));
		if (!amount) return world;

		let total = world.hour * 60 + world.minute + amount;
		let dayDelta = Math.floor(total / (24 * 60));
		total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
		world.hour = Math.floor(total / 60);
		world.minute = total % 60;

		while (dayDelta > 0) {
			world.day += 1;
			const dim = daysInMonth(world.year, world.month);
			if (world.day > dim) {
				world.day = 1;
				world.month += 1;
				if (world.month > 12) {
					world.month = 1;
					world.year += 1;
				}
			}
			dayDelta -= 1;
		}

		if (typeof Stats !== "undefined" && Stats.passiveDecay) {
			Stats.passiveDecay(amount, vars);
		}
		return world;
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatDate(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { dateFormat: "MM/DD/YYYY" };
		const y = String(world.year);
		const m = String(world.month).padStart(2, "0");
		const d = String(world.day).padStart(2, "0");
		const format = options.dateFormat || "MM/DD/YYYY";
		if (format === "DD/MM/YYYY") return `${d}/${m}/${y}`;
		if (format === "YYYY/MM/DD") return `${y}/${m}/${d}`;
		return `${m}/${d}/${y}`;
	}

	/**
	 * Long date for prose, e.g. "Saturday, March 21, 2048".
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatDateLong(variables) {
		const world = ensure(variables);
		return `${weekdayName(variables)}, ${MONTH_NAMES[world.month - 1]} ${world.day}, ${world.year}`;
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatTime(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		return formatTimeAt(world.hour, world.minute, vars);
	}

	/**
	 * Formats an arbitrary clock time using $options.timeFormat.
	 *
	 * @param {number} hour
	 * @param {number} minute
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatTimeAt(hour, minute, variables) {
		const vars = variables || V();
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { timeFormat: "12" };
		const h = Math.max(0, Math.min(23, Math.floor(Number(hour) || 0)));
		const m = String(Math.max(0, Math.min(59, Math.floor(Number(minute) || 0)))).padStart(2, "0");
		if (String(options.timeFormat) === "24") {
			return `${String(h).padStart(2, "0")}:${m}`;
		}
		const period = h >= 12 ? "PM" : "AM";
		let hour12 = h % 12;
		if (hour12 === 0) hour12 = 12;
		return `${hour12}:${m} ${period}`;
	}

	/**
	 * Weather adjective for prose ("fair", "rainy", …).
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function weatherText(variables) {
		const world = ensure(variables);
		return WEATHER_TEXT[world.weather] || world.weather || "fair";
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatTemperature(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { temperature: "fahrenheit" };
		const c = Number(world.temperatureC) || 0;
		if (options.temperature === "celsius") {
			return `${Math.round(c)}°C`;
		}
		return `${Math.round(c * (9 / 5) + 32)}°F`;
	}

	/**
	 * @param {string} id
	 * @param {string} [label]
	 * @param {object} [variables]
	 */
	function setLocation(id, label, variables) {
		const world = ensure(variables);
		world.location = id || "";
		world.locationLabel = label || id || "";
	}

	Object.assign(World, {
		WEEKDAYS,
		MONTH_NAMES,
		WEATHER_TEXT,
		SEASON_STARTS,
		SEASON_IDS,
		createDefaults,
		ensure,
		resolveStartingSeason,
		applyStartingSeason,
		startNew,
		daysInMonth,
		toDate,
		weekdayName,
		seasonForMonth,
		season,
		advance,
		formatDate,
		formatDateLong,
		formatTime,
		formatTimeAt,
		weatherText,
		formatTemperature,
		setLocation,
	});
})();
