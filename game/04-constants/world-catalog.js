/**
 * Calendar, weather, homes, and time-of-day bands. Engine: World.
 */

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

	const TIME_BANDS = [
		{ id: "night", until: 6 * 60 },
		{ id: "morning", until: 12 * 60 },
		{ id: "afternoon", until: 17 * 60 },
		{ id: "evening", until: 21 * 60 },
		{ id: "night", until: 24 * 60 },
	];

	const HOME_BY_AGE = {
		older: {
			id: "apartment-bedroom",
			label: "Garden South Street — Apartment",
			passage: "Apartment Bedroom",
			locationIds: [
				"apartment-bedroom",
				"apartment-living-room",
				"apartment-kitchen",
				"apartment-hallway",
				"apartment-hallway-upper",
				"apartment-hallway-lower",
			],
		},
		younger: {
			id: "bloomshore-bedroom",
			label: "Bloomshore District — Home",
			passage: "Bloomshore Bedroom",
			locationIds: [
				"bloomshore-bedroom",
				"bloomshore-hallway",
				"bloomshore-caleb-bedroom",
				"bloomshore-grandma-bedroom",
				"bloomshore-downstairs",
				"bloomshore-living-room",
				"bloomshore-kitchen",
			],
		},
	};


	ConstantsLoader.add("world", {
		weekdays: WEEKDAYS,
		monthNames: MONTH_NAMES,
		weatherText: WEATHER_TEXT,
		seasonStarts: SEASON_STARTS,
		seasonIds: SEASON_IDS,
		timeBands: TIME_BANDS,
		homeByAge: HOME_BY_AGE,
	});
})();
