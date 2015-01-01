#!/usr/bin/env node

var fs = require('fs')
    dnode = require('dnode'),
    nano = require('nano')('http://localhost:5984'),
    db = nano.use('honeybadger'),
    feed = db.follow({since: "now"}),
    utility = require('./lib/utility'),
    DataManager = require('./lib/data-manager'),
    scheduler = require('./lib/scheduler');

var dnode_port = 8120;

/**
 * Before we start up any services; let's see if we're getting
 * called with a control option.
 *
 * We're assuming you're starting with either:
 *  * forever start -w honeybadger.js
 *  * node honeybadger.js [command]
 *
 * In either case the first two args will be node and honeybadger
 * paths respectively. If we change this to a binary or symlink
 * later on we'll want to check those values to find where [commands]
 * really start.
 */
// if (process.argv.length > 2) {
// 	// We have a command - process it and exit;
// 	console.log('Console args:',process.argv);
// 	process.exit(0);
// }


var honeybadger = function(){
	var config;

	this.loadConfig = function(path){
		var configpath = (path) ? path : './config.json';
		// console.log('Loading config: '+configpath);

		config = require(configpath);
		return config;
	};

	this.runTask = function(id){
		var task;
		if (task = DataManager.getTask(id).pop()) {
			console.log('Registering task with scheduler');
			scheduler.addTask(task.value);
		} else return false;
	}
};

honeybadger.main = function() {
	console.log('Starting Honey Badger Service');

	var hb = new honeybadger();
	var config = hb.loadConfig();

	if (!config) throw new Error('No config');

	console.log('Waiting for stdin at /proc/'+process.pid+'/fd/0');
	console.log('Stdin is a TTY:', process.stdin.isTTY);

	if (process.stdin.isTTY) {
		process.stdin.setEncoding('utf8');
		process.stdin.resume();
		process.stdin.on('data', function(c) {
			switch(c.trim())
			{
				case "tasks":
					console.log('Available tasks');
					DataManager.tasks.map(function(item){
						console.log(item.id);
					});
				break;
				case "run":
					hb.runTask('9eb3c6eb3047017b64847c534e0008ca');
				break;
				case "help":
					console.log('You can run `tasks` `run` or `help`');
				break;
				default:
					console.log('No command...');
			}
		});
	}

	/**
	 * Follow database changes
	 */
	feed.on('change', function (change) {
	    DataManager.refresh();
	});
	feed.follow();

	/**
	 * Fire up dnode and link it to honeybadger
	 */
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