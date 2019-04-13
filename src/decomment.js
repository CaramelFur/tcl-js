/*jslint white: true, plusplus: true */
/*global define */

module.exports = function (str) {
	var out = [],
		lines = str.split('\n'),
		i;
	for (i = 0; i < lines.length; i++) {
		if (!/^\s*#/.test(lines[i])) {
			out.push(lines[i]);
		}
	}
	return out.join('\n');
};
