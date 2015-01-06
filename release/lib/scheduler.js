var log = require('debug')('honeybadger:scheduler'),
	schedule = require('node-schedule'),
	worker = require('./worker');

var scheduler = new (function(){
	var tasks = [];

	this.addTask = function(task){
		var date = new Date(task.runDate);
		log('Scheduling task for:', task.name, date);
		schedule.scheduleJob(date, function(){
			log('Scheduled task starting up', task.name);
			var w = new worker();
			w.runTask(task,function(){
				log('Task complete', task.name);
			});
		});
	};
})();

module.exports = scheduler;