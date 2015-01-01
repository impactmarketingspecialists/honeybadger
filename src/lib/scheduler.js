var schedule = require('node-schedule');
var worker = require('./worker');

var scheduler = new (function(){
	var tasks = [];

	this.addTask = function(task){
		var date = new Date(task.runDate);
		console.log('Scheduling task for:', task.name, date);
		schedule.scheduleJob(date, function(){
			console.log('Scheduled task starting up', task.name);
			var w = new worker();
			w.runTask(task,function(){
				console.log('Task complete', task.name);
			});
		});
	};
})();

module.exports = scheduler;