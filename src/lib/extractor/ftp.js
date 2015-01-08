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
var log = require('debug')('HoneyBadger:Extractor:FTP');

/** core deps */
var util = require('util');
var url = require('url');
var libftp = require('ftp');
var Extractor = module.parent.exports;

util.inherits( FTP, Extractor );
function FTP( options ) {

	var $this = this;
	var client = null;
    var stream = null;
    var readyState = 0;

    Extractor.call(this);

    this.connect = function(){
    	readyState = 1; // Connecting
		client = new libftp();

		client.on('error', function(error) {
			readyState = -1 // Error
			log('Connection failed: %s', error);
            console.trace('Connection failed:', error);
			$this.emit('error',error);
		});

		client.on('ready', function() {
			readyState = 2; // Success
			log('Connected to FTP as %s.', options.source.auth.username);
			$this.emit('ready', null, 'success');
		});

		client.connect({
			host: options.source.uri,
			port: options.source.port,
			user: options.source.auth.username,
			password: options.source.auth.password
		});

    };

    this.start = function(){
        if (readyState < 2) throw('Extractor is not ready to start');
        log('Starting extraction');

        client.get(options.target.res, function(error, real_stream){
            if (error) {
                log('Error extracting target');
                console.trace(error);
                $this.emit('error',error);
                return;
            }

            stream = real_stream;
            log('Setup resource stream');

            stream.once('close', function(){
                log('Stream closed');
                client.end();
            });

            $this.emit('data', stream);
        });
    };

    this.destroy = function(){
    	log('Destroying FTP extractor');
    	if (client !== null) {
    		try {
    			client.end();
    			client = null;
    		} catch(e) {
    			console.trace(e);
    		}
    	}
    };

    this.pipe = stream;

    this.init();
}