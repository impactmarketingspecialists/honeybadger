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

var CSV = exports;

/** log facility */
var log = require('debug')('HoneyBadger:Helper:CSV');

/** core deps */
var Parser = require('csv-stream');

CSV.parse = function(delimiter, quotes, data, callback){
	// var errors = fired = false;
	// var headers = null;
	// var parser = libcsv({delimiter:delimiter, quote: quotes, columns: function(head){
	// 	if (head.length <= 1) {
	// 		errors = true;
	// 		fired = true;
	// 		log('Parser errored on CSV headers');
	// 		callback('headers',null);
	// 	} else {
	// 		headers = head;
	// 		log('Parser discovered CSV headers');
	// 		// Let's fire our headers callback immediately
	// 		fired = true;
	// 		callback(null,{headers:headers})
	// 	}
	// }});
	
	var parser = new Parser({
		delimiter: delimiter,
		escapeChar: quotes,
		objectMode: false
		// columns: true
	})

	parser.on('readable',function(){
		// log('Parser readable');
	});

	parser.on('data',function(){
		// log('Parser record');
	});

	parser.on('finish',function(){
		log('Parser finish');
	});

	parser.on('end',function(){
		log('Parser end');
		parser = null;
	});

	parser.on('close',function(){
		log('Parser stream closed');
	});

	parser.on('error',function(err){
		log('Parser error', err);
	});

	/**
	* Let's see if data has a pipe() method.
	*
	* I'm using this as a dirty method to see if data
	* is a stream. We like streams :) we'll return it so
	* it's chainable.
	*/
	if (typeof data.pipe === 'function') {
		return data.pipe(parser);
	} else if (typeof data.data !== 'undefined') {
		parser.write(data.data);
		parser.end();
		return parser;
	}
};