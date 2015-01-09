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

module.exports = MySQL;

/** log facility */
var log = require('debug')('HoneyBadger:Loader:MySQL');

/** core deps */
var util = require('util');
var utilily = require('../utility');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

util.inherits( MySQL, EventEmitter );
util.inherits( MySQL, stream.Transform );
function MySQL( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	var beans = 0;
	var inserts = 0;
	var headers = []

	var mysql = require('mysql');
	var dsn = utility.dsn(options.target.dsn);
	var connection = mysql.createConnection({
		host: dsn.host,
		user: dsn.user,
		password: dsn.password,
		database: dsn.database
	});

	var insert_query = 'INSERT INTO '+options.target.schema.name+' SET ?';

	/** We are TOTALLY ASSUMING that chunks are records 
	 *  coming from a CSV stream processor. That's probably not
	 *  the safest assumption longterm ;)
	 */
	this._transform = function(chunk, encoding, callback) {
		if (beans === 0) { // CSV header row
			headers = chunk;
		} else {
			var record = {};
			options.transform.normalize.forEach(function(item, index){
				var i = headers.indexOf(item.in);
				record[item.out] = chunk[i];
			});
			console.log(record);
			connection.query(insert_query,record,function(err,res){
				if (err) {
					log('Error inserting record %s for loader', inserts++, options.name);
					console.trace(err);
					return;
				}
				log('Inserted record',inserts++);
			});
		}

		beans++;
		log('Processed record', beans);

		if (this._readableState.pipesCount > 0) this.push(chunk);
		return callback();
	};

	this._flush = function(){
		log('Completed '+beans+' records');
	};
}