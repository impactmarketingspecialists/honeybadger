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

module.exports = RETS;

/** log facility */
var log = require('debug')('HoneyBadger:Extractor:RETS');

/** core deps */
var util = require('util');
var url = require('url');
var librets = require('rets-client');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

util.inherits( RETS, EventEmitter );
util.inherits( RETS, stream.Transform );
function RETS( options )
{
    var $this = this;
    EventEmitter.call(this);
    stream.Transform.call(this, {objectMode: true});

    var uri = url.parse(options.source.uri);

    /**
     * I'm getting some weird session overlap
     * with creating multiple instances of my
     * rets class. I'm afraid it's because there
     * are variables registered with each require?
     *
     * I'm moving this out of the head to here.
     * Hopefully calling require each time you create
     * an instance of this class will cure the
     * overlap.
     *
     * ** didn't help; keeping this here and going
     * through node-rets-client to hunt down naughty
     * globals.
     */
    var client = null;
    var readyState = 0;

    this.connect = function() {
        readyState = 1; // Connecting
        client = librets.createConnection({
            host: uri.hostname,
            port: uri.port,
            protocol: uri.protocol,
            path: uri.path,
            user: options.source.auth.username,
            pass: options.source.auth.password,
            version: options.source.version || '1.7.2',
            agent: { user: options.source.auth.userAgentHeader, password: options.source.auth.userAgentPassword }
        });

        client.once('connection.error',function(error, client){
            readyState = -1; // Error
            console.trace( 'Connection failed: %s.', error.message );
            log( 'Connection failed: %s.', error.message );
            $this.emit('error', error);
        });

        client.once('connection.success',function(client){
            readyState = 2; // Connected
            log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
            $this.emit('ready', null, 'success');
        });
    };

    this.start = function() {
        if (readyState < 2) throw('Extractor is not ready to start');

        var qry = {
            SearchType: options.target.type,
            Class: options.target.class,
            Query: options.target.res,
            Format: 'COMPACT-DECODED',
            Limit: 10
        };

        client.searchQuery(qry, function( error, data ) {

            // log(error, data);
            
            if (error) {
                log(error, data);
                $this.emit('error', error, data);
                return;
            } else if (data.type == 'status') {
                log(data);
                if (!data.data || !data.data.length) {
                    log(data.text+'\nJust because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.');
                    $this.emit('error', 'No records');
                    return;
                }
            } else if (!data.data || !data.data.length) {
                log(data.text+'\nJust because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.');
                $this.emit('error', 'No records');
                return;
            }

            // $this.emit('data', data);
        });
    };

    this._transform = function(chunk, encoding, callback){
        if (this._readableState.pipesCount > 0) this.push(chunk);
        callback();
    };

    this._flush = function(callback){
        log('Completed reading RETS resource');
        callback();
    };

    this.connect();
};



