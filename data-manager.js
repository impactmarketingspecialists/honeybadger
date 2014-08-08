var fs = require('fs');
var path = require('path');
var url = require('url');
var express = require('express');
var app = new express();
var http = require('http').createServer(app);
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: http });
var async = require('async');
var nano = require('nano')('http://localhost:5984');
var db = nano.use('honeybadger');
var feed = db.follow({since: "now"});

var http_port = 8090;

app.use(express.bodyParser());

var DataManager = new (function(){
    var sources = [];
    var extractors = [];

    var refreshSources = function(){
        db.view('sources', 'list', function(err, body) {
            if(!err) {
                sources = [];
                body.rows.forEach(function(doc){
                    sources.push(doc);
               });
            } else console.trace(err);
        });
    };

    var refreshExtractors = function(){
        db.view('extractors', 'list', function(err, body) {
            if(!err) {
                extractors = [];
                body.rows.forEach(function(doc){
                    extractors.push(doc);
               });
            } else console.trace(err);
        });
    };

    Object.defineProperty(this, "sources", {
        get: function() { return sources; }
    });

    Object.defineProperty(this, "extractors", {
        get: function() { return extractors; }
    });

    this.refresh = function(){
        refreshSources();
        refreshExtractors();
    };

    this.sourceDetail = function(id) {
        return sources.find(function(e) {
            return e._id === id;
        });
    };

    this.sourceSave = function(source, callback) {

        var _updateSource = function(){
            if (!source._rev) {
                console.log('Document has no _rev; cannot update');
                console.trace();
                callback({err:true,body:'Document has no _rev; cannot update'});
                return false;
            }

            db.insert(source, source._id, callback);
        };

        var _newSource = function(){
            source.type = 'dsn'; // Set the document type to Data Source Name
            source.status = 'active'; // Activate the source
            source.activatedOn = Date.now();
            db.insert(source, null, callback);
            refreshSources();
        };

        if (source._id) _updateSource();
        else _newSource();
    };

    this.refresh();
});

var WSAPI = {
    list: function(callback){
        process.nextTick(function(){
            callback('onList', null, DataManager.sources);
        });
    },
    getExtractorList: function(callback){
        process.nextTick(function(){
            callback('onExtractorList', null, DataManager.extractors);
        });
    },
    validateSource: function(source, callback) {

        switch(source.type)
        {
            case "FTP":
                console.log('FTP Client Test');
                var client = require('ftp');
                var c = new client();

                c.on('ready', function() {
                    c.list(function(err, list) {
                      if (err) {
                        process.nextTick(function(){
                            callback('onvalidate',err,null);
                        });
                        return;
                      }
                      c.end();
                      process.nextTick(function(){
                        callback('onvalidate',null,{success:true})
                      })
                    });
                });

                c.on('error', function(e) {
                    console.trace(e);
                    process.nextTick(function(){
                        callback('onvalidate',e,null);
                    });
                });

                c.connect({
                    host: source.uri,
                    port: source.port,
                    user: source.auth.username,
                    password: source.auth.password
                });
            break;
            case "RETS":
                var librets = require('rets-client');

                var uri = url.parse(source.uri);

                var client = librets.createConnection({
                    host: uri.hostname,
                    port: uri.port,
                    path: uri.path,
                    user: source.auth.username,
                    pass: source.auth.password,
                    version: source.version || '1.5',
                    agent: { user: source.auth.userAgentHeader }
                });

                client.once('connection.success',function(client){
                    console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                    callback('onvalidate',null,{success:true});
                });

                client.once('connection.error',function(error, client){
                    console.error( 'Connection failed: %s.', error.message );
                    callback('onvalidate',error, null);
                });
            break;
        }
    },
    saveSource: function(source, callback) {
        DataManager.sourceSave(source, function(err, body){
            callback('onsave',err,body);
        });
    }
}

var baseURL = '/data-manager';
app.use(baseURL+'/', express.static(path.resolve('www/'))); // Path resolve clears forbidden exception
app.use(baseURL+'/js', express.static('www/js/'));
app.use(baseURL+'/css', express.static('www/css/'));
app.use(baseURL+'/images', express.static('www/images/'));
app.use(baseURL+'/fonts', express.static('www/fonts/'));

// app.get(baseURL+'/',function(req, res){
//     res.status(200).set('Content-Type', 'text/html').send('OK');
// });

app.get(baseURL+'/download',function(req,res){
});

app.post(baseURL+'/upload',function(req, res){
});

wss.on('connection',function(ws) {
    // var connection = request.accept(null, request.origin);
    // clients.push(connection);

    console.log('WebSocket connection accepted');

    ws.on('message',function(message, flags){
        // console.log('WebSocket message received',message);
        
        if (!message) { 
            console.log('WebSocket empty message');
            ws.send('Error: malformed request');
            return false; 
        }

        var data = JSON.parse(message);
        if (!data) {
            console.log('WebSocket bad message');
            ws.send('Error: malformed request');
            return false; 
        }

        if (WSAPI[data.method]) {
        	var args = [];
			if(data.args) {
				data.args.forEach(function(item){
					args.push(item);
				});
			}
        	args.push(function(event, err, body){
			    ws.send(JSON.stringify({
                    event: event,
                    msig: data.msig || null,
                    err:err,
                    body:body
                }));
			});
			// console.dir(args);
        	WSAPI[data.method].apply(this, args);
        } else {
            console.log('Method '+data.method+' does not exist');
            ws.send('Error: malformed request');
            return false;         	
        }
    });

    ws.on('close',function(connection){
    	// clients.slice(clients.indexOf(connection),1);
        console.log('Websocket connection closed');
    });
});


feed.on('change', function (change) {
    DataManager.refresh();
});
feed.follow();

http.listen(http_port);

exports.DataManager = DataManager;