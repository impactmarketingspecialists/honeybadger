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

module.exports = Normalize;

/** log facility */
var log = require('debug')('HoneyBadger:Transformer:Normalize');

/** core deps */
var util = require('util');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;
// var Transformer = module.parent.exports;

util.inherits( Normalize, EventEmitter );
util.inherits( Normalize, stream.Transform );
function Normalize( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	var beans = 0;

	this._transform = function(chunk, encoding, callback) {
		log('Processed record', beans++);
		if (this._readableState.pipesCount > 0) this.push(chunk);
		return callback();
	};

	this._flush = function(){
		log('Completed '+beans+' records');
		// this.push(null);
		// this.end();
	};
}