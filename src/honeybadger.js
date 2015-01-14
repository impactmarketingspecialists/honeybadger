// Copyright Impact Marketing Specialists, Inc. and other contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = HoneyBadger;

/** log facility */
var log = require('debug')('HoneyBadger');

/** core deps */
var fs = require('fs');
var dnode = require('dnode');
var utility = require('./lib/utility');
var DataManager = require('./lib/data-manager');
var Scheduler = require('./lib/scheduler');

/** constants */
HoneyBadger.dnode_port = 8120;

function HoneyBadger(){
	var self = this;
	var config;
	var tasks;
	var cron;

	this.initialized = false;

	this.loadConfig = function(path){
		var configpath = (path) ? path : './config.json';
		log('Loading config: '+configpath);

		config = require(configpath);
		return config;
	};

	this.loadTasks = function(tasks){
		log('Initalizing task queue');
		tasks.forEach(function(task){
			self.registerTask(task.value);
		});
		this.initialized = true;
	}

	this.registerTask = function(task){
		log('Registering task with scheduler');
		cron.addTask(task);
	}

	this.start = function(){
		cron = new Scheduler();
	}
};

HoneyBadger.Service = {
	main: function() {
		log('Starting Honey Badger Service');

		var hb = new HoneyBadger();
		var config = hb.loadConfig();

		if (!config) throw new Error('No config');


		/**
		 * Fire up dnode and link it to honeybadger
		 */
		if (config.dnode) {
			var dserver = dnode(hb);
			var port = config.dnode_port || HoneyBadger.dnode_port;

			dserver.listen(port);
			log('Dnode services started on:', port);
		}

		/**
		 * Wait for DataManager to load from couch
		 */
		DataManager.on('ready', function(){
			if (!hb.initialized) hb.loadTasks(DataManager.tasks);
		});

		hb.start();
	}
};
