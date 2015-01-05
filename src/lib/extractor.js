var util = require('util');
var events = require('events');

/** global */
extractor = function(){};
util.inherits(extractor, events.EventEmitter );

// var ftp = require('./extractor/ftp');
var rets = require('./extractor/rets');

/**
 * Return an extractor
 * @param  {object} source    source configuration object
 * @param  {object} extractor extractor configuration object
 * @return {extractor}        instance of an extractor
 */
var factory = function(options){
	if (!options || !options.source.type) throw('No extractor source type specified');

	// The type of extractor we use is based on the source we are trying to extract from
	switch(options.source.type){
		case 'file':
		break;
		case 'ftp':
		break;
		case 'http':
		break;
		case 'soap':
		break;
		case 'RETS':
			return rets.initialize(options);
		break;
		case 'stream':
		break;
		default:
			throw('No supported extractor found', options.source.type);
	}
};

module.exports = {
	Factory: factory,
	Extractor: extractor
};