const dateFormat = require('dateformat');

module.exports = {
	date: (date, format='yy/dd/mm hh:mmtt') => {
		return dateFormat(date, format);
	},
}
