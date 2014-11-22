var util = require('util');
var events = require('events');
var libcsv = require('csv-parse');

var csv = function()
{
	events.EventEmitter.call(this);
	var self = this;

};

util.inherits(rets,events.EventEmitter);
exports.rets = rets;