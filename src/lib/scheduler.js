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

module.exports = Scheduler;

/** log facility */
var log = require('debug')('HoneyBadger:Scheduler');

/** core deps */
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var	schedule = require('node-schedule');
var	worker = require('./worker');

util.inherits(Scheduler, EventEmitter);
function Scheduler() {
	var $this = this;
	var tasks = [];

	EventEmitter.call(this);

	this.addTask = function(task){
		var today = new Date();
		var date = new Date(task.runDate + ' ' + task.runTime);
		var rule = date;

		log('Scheduling a job task %s at', task.name, date.toString());

		rule = new schedule.RecurrenceRule();
		rule.hour = date.getHours();
		rule.minute = date.getMinutes();
		rule.dayOfWeek = [0,1,2,3,4,5,6];

		$this.emit('add',task,date);

		schedule.scheduleJob(rule, function(){
			log('Starting task %s', task.name);
			$this.emit('start',task);

			var w = new worker();
			w.runTask(task,function(){
				log('Scheduled Task: %s ...complete', task.name);
				$this.emit('complete',task);
			});
		});
	};
}


