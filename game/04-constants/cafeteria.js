/**
 * Cafeteria lunch vignettes.
 */

(function () {
	"use strict";

	const DURING = [
		{
			id: "chatter",
			text: "The cafeteria buzzes with the usual lunchtime chatter.",
		},
		{
			id: "dropped-tray",
			text: "Someone drops a tray across the cafeteria, followed by a chorus of jeers. The student that dropped the tray frantically starts cleaning up the mess.",
		},
		{
			id: "overlapping-noise",
			text: "The cafeteria is filled with the overlapping noise of conversation, chairs scraping against the floor, and utensils clattering against trays.",
		},
		{
			id: "quieter",
			text: "The cafeteria is surprisingly quieter today than usual.",
		},
		{
			id: "club-posters",
			text: "There are multiple groups of students handing out posters today, promoting their clubs and electives.",
		},
		{
			id: "come-and-go",
			text: "Groups of students come and go. Some rush out the doors to get to their classes on time, some scurry in, hoping to be first in line to get lunch before the cafeteria packs with people.",
		},
	];

	ConstantsLoader.add("cafeteria", {
		during: DURING,
	});
})();
