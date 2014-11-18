var fs = require('fs');
var dnode = require('dnode');
var dnode_port = 8120;

var rets = require('./lib/rets-extractor.js').rets;

var honeybadger = function(){
	var config;

	this.loadConfig = function(path){
		var configpath = (path) ? path : './config.json';
		// console.log('Loading config: '+configpath);

		config = require(configpath);
		return config;
	};
};

honeybadger.main = function() {
	console.log('Starting Honey Badger Service');
	var hb = new honeybadger();
	var config = hb.loadConfig();

	if (!config) throw new Error('No config');

	if (config.dnode) {
		var dserver = dnode(hb);
		var port = config.dnode_port || dnode_port;

		dserver.listen(port);
		console.log('dnode started on:', port);
	}

	// var extractor = new rets();
};

honeybadger.main();

exports.honeybadger = honeybadger;