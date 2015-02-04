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
var fs = require('fs');
// var mkdirp = require('mkdirp')
var http = require('../extractor/http');
var filesystem = require('../loader/filesystem');
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

    var beans = 0;
    var sidebeans = 0;
    var sidebeansComplete = 0;

    var uri = url.parse(options.source.uri);
    var keeppushing = true;
    var extractIndex = null;

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
            if (readyState === 2) return; //We've already connected
            readyState = 2; // Connected
            log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
            $this.emit('ready', null, 'success');
        });
    };

    this.start = function() {
        if (readyState < 2) throw('Extractor is not ready to start');

        var Query = utility.tokenz(options.target.res);
        log('RETS Request => SearchType: %s Class: %s Query: %s', options.target.type, options.target.class, Query);

        var qry = {
            SearchType: options.target.type,
            Class: options.target.class,
            Query: Query,
            Format: 'COMPACT-DECODED',
            Limit: 8000
        };

        // $this->GetRETSOption('PropertyPhotoKey')
        // GetObject($strResourceType, $strDataType, $intResourceID, $intPhotoNumber='*', $bLocation=0)
        // GetObject('Property', 'Photo', 'PropertyPhotoKey,PropertyPhotoKey,PropertyPhotoKey', '*', 0)

        // client.searchQuery(qry, ondata, true);
        // var csv = require('../helpers/csv');

        // // Overwrite stream
        // var csvStream = csv.parse('\u0009', '"', client);
        // csvStream.on('headers',function(error, res){
        //     log('Received headers from CSV helper');
        //     $this.emit('readable');
        // });

        // csvStream.on('end',function(){
        // });

        // csvStream.on('finish',function(){
        // });

        client.pipe($this);

        if (options.target.options) {
            var extract = (options.target.options.mediaExtract === true) ? options.target.options.mediaExtractKey : null;
            if (extract) {
            }
        }

        var request = client.searchQuery(qry, null, true);

    };

    this.GetURL = function(_class, index, key, url){
        log('Creating Side-Channel Extraction for ListKey: %s from %s', key, url);
        // var basepath = '/home/dgraham/tmp/mlsphotos/'+key+'-'+index+'-'+_class+'';
        var basepath = '/media/fdrive/data/MRMLS/images/'+key;

        var extract_opts = { source: { url: url } };
        var loader_opts = { binary:true, target: { path: basepath+'.jpg' } };

        var $e = new http(extract_opts);
        var $l = new filesystem(loader_opts);
        $e.pipe($l);
        $e.on('ready',function(){
            log('HTTP Sub-extractor ready');
            sidebeans++;
            $e.start();
        });

        $l.on('finish',function(){
            sidebeansComplete++
            if (sidebeansComplete == 1) log('Continued Side-Channel extraction: %s of %s records', sidebeansComplete, sidebeans);
            if (sidebeansComplete % 100 == 0) log('Continued Side-Channel extraction: %s of %s records', sidebeansComplete, sidebeans);
            if (sidebeans === sidebeansComplete) log('Completed Side-Channel Extraction with %s records',sidebeansComplete);
        });
        
        // fs.exists(basepath, function(exists){
        //     if (!exists) mkdirp(basepath,function(err){

        //         if (err) { console.trace(err); return; }

        //         var extract_opts = { source: { url: url } };
        //         var loader_opts = { target: { path: basepath+key+'.jpg' } };

        //         var $e = new http(extract_opts);
        //         var $l = new filesystem(loader_opts);
        //         $e.pipe($l);
        //         $e.on('ready',function(){
        //             // log('HTTP Sub-extractor ready');
        //             $e.start();
        //         });

        //     });
        //     else {

        //         var extract_opts = { source: { url: url } };
        //         var loader_opts = { target: { path: basepath+key+'.jpg' } };

        //         var $e = new http(extract_opts);
        //         var $l = new filesystem(loader_opts);
        //         $e.pipe($l);
        //         $e.on('ready',function(){
        //             // log('HTTP Sub-extractor ready');
        //             $e.start();
        //         });
                
        //     }
        // });

    };

    this.GetObject = function(id){

    };

    this._transform = function(chunk, encoding, callback){
        beans++;

        // We'll look for keys to create a side-channel extraction if needed
        if (options.target.options && options.target.options.mediaExtract === true) {
            var extract = options.target.options.mediaExtractKey || null;
            var record = chunk.toString('utf8').split('\t');
            if (extractIndex === null && record.indexOf(extract) > -1) extractIndex = record.indexOf(extract);
            else if (extractIndex !== null) {
                process.nextTick(function(){$this.GetURL(record[4],record[8],record[3],record[extractIndex]);});
            }
        }

        // if (this._readableState.pipesCount > 0) log('READABLE>>>>>>>>>>>>>>>')
        // 
        // $this.emit('data', chunk); ?? .trim() ??
        if (keeppushing) keeppushing = this.push(chunk.toString('utf8').split('\t'));
        callback();
    };

    this._flush = function(callback){
        log('Completed reading RETS resource');
        callback();
    };

    this.connect();
};



