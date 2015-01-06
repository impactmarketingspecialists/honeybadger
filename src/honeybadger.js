#!/usr/bin/env node

var fs = require('fs')
    dnode = require('dnode'),
    log = require('debug')('honeybadger'),
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
// 	log('Console args:',process.argv);
// 	process.exit(0);
// }


var honeybadger = function(){
	var self = this;
	var config;
	var tasks;

	this.loadConfig = function(path){
		var configpath = (path) ? path : './config.json';
		// log('Loading config: '+configpath);

		config = require(configpath);
		return config;
	};

	this.loadTasks = function(tasks){
		log('Initalizing task queue');
		tasks.forEach(function(task){
			self.registerTask(task.value);
		});
	}

	this.registerTask = function(task){
		log('Registering task with scheduler');
		scheduler.addTask(task);
	}

	this.start = function(){

	}
};

honeybadger.main = function() {
	log('Starting Honey Badger Service');

	var hb = new honeybadger();
	var config = hb.loadConfig();

	if (!config) throw new Error('No config');


	/**
	 * Fire up dnode and link it to honeybadger
	 */
	if (config.dnode) {
		var dserver = dnode(hb);
		var port = config.dnode_port || dnode_port;

		dserver.listen(port);
		log('dnode started on:', port);
	}

	DataManager.on('tasks', function(tasks){
		hb.loadTasks(tasks);
	});

	hb.start();
};

honeybadger.main();

exports.honeybadger = honeybadger;