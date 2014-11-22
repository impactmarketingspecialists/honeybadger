var util = require('util');
var events = require('events');

var extractor = {
	/**
	 * Factory for extractor
	 */
	create: function(options) {
		if (!options || !options.type) throw('No extractor type specified');
		switch(type){
			case 'file':
			break;
			case 'ftp':
			break;
			case 'http':
			break;
			case 'soap':
			break;
			case 'rets':
			break;
			case 'stream':
			break;
		}
	}
};

exports.extractor = extractor;