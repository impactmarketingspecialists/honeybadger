var util = require('util');
var events = require('events');

var extractor = {
	load: function(source, type, callback) {
		process.nextTick(function(){
			callback(null,{});
		});
	}
};

exports.extractor = extractor;