var dnode = require('dnode');
var dnode_port = 8120;

var honeybadger = function(){
	var config;
	this.loadConfig = function(path){
		var configpath = (path) ? path : './config.json';
		config = require(configpath);
		return config;
	};
};

honeybadger.main = function() {
	var hb = new honeybadger();
	var dserver = dnode(hb);
	dserver.listen(dnode_port);
};

exports.honeybadger = honeybadger;