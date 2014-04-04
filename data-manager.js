var fs = require('fs');
var path = require('path');
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

feed.on('change', function (change) {
  console.log("change: ", change);
});
feed.follow();

var DataManager = new (function(){
    var sources = [];

    db.view('sources', 'list', function(err, body) {
        if(!err) {
            sources = [];
            body.rows.forEach(function(doc){
                sources.push(doc);
            });
        } else console.trace(err);
    });

    Object.defineProperty(this, "sources", {
        get: function() { return sources; }
    });

    this.sourceDetail = function(id) {
        return sources.find(function(e) {
            return e._id === id;
        });
    };

});

var WSAPI = {
    list: function(callback){
        process.nextTick(function(){
            callback(DataManager.sources);
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
			    ws.send(JSON.stringify({event: event, err:err,body:body}));
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

http.listen(http_port);

exports.DataManager = DataManager;