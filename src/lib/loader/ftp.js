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

module.exports = FTP;

/** log facility */
var log = require('debug')('HoneyBadger:Loader:FTP');

/** core deps */
var util = require('util');
var ftp = require('../helpers/transports/ftp');
var Client = require('ftp');
var utilily = require('../utility');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

util.inherits( FTP, EventEmitter );
util.inherits( FTP, stream.Transform );
function FTP( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	var c = new Client();
	var dsn = utility.dsn(options.target.dsn);
	var beans = 0;

	c.on('ready', function() {
		log('Connection ready, piping to remote target');
		var tkexp = /{(.*?)}/gi;
		var fnexp = /\((.*?)\)/;
		var filename = options.target.filename;
		var tokens = filename.match(tkexp);
		if (tokens.length) {
			tokens.forEach(function(item,index){
				var token = item.replace('{','').replace('}','');
				var fn = token.match(fnexp);
				var arg = null;

				if (fn.length) {
					arg = fn[1];
					fn = token.substr(0,token.indexOf('('));

					switch(fn)
					{
						case "Date":
							var d = (arg === '' || arg === 'today') ? new Date() : new Date(arg);
							console.log(d);
							var val = d.getFullYear() + '-' + ( (d.getMonth()+1 < 10) ? '0'+(d.getMonth()+1) : (d.getMonth()+1) ) + '-' + d.getDate();
							filename = filename.replace(item, val);
						break;
					}
				}
				console.log(token, fn, arg, filename);

			});
		}
		
		c.put($this, options.target.basepath + filename, function(err){
			log('Stream data transfer complete');
			c.end();
			if (err) {
				console.trace(err);
			}
		});
		$this.emit('ready');
	});

	c.on('close', function(){
		log('Connection closed');
		c.destroy();
	});

	c.on('error', function(err) {
		log('Error', err);
		console.trace(err);
	});

	c.connect({
		host: dsn.host,
		port: dsn.port,
		user: dsn.user,
		password: dsn.password
	});

	/** We are TOTALLY ASSUMING that chunks are records 
	 *  coming from a CSV stream processor. That's probably not
	 *  the safest assumption longterm ;)
	 */
	this._transform = function(chunk, encoding, callback) {

		beans++;
		// log('Processed record', beans);

		this.push(chunk.join('|')+'\r\n');
		return callback();
	};

	this._flush = function(callback){
		log('Completed '+beans+' records');
		callback();
	};
}