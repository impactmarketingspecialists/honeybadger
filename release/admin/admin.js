var fs = require('fs')
    path = require('path'),
    url = require('url'),
    express = require('express'),
    app = new express(),
    http = require('http').createServer(app),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: http }),
    async = require('async'),
    nano = require('nano')('http://localhost:5984'),
    db = nano.use('honeybadger'),
    feed = db.follow({since: "now"}),
    utility = require('../lib/utility'),
    DataManager = require('../lib/data-manager'),
    WSAPI = require('../lib/api/admin'),
    http_port = 8090;

var baseURL = '/admin';
var basePath = 'admin';
app.use(baseURL+'/', express.static(path.resolve(basePath+'/www/'))); // Path resolve clears forbidden exception
app.use(baseURL+'/js', express.static(basePath+'/www/js/'));
app.use(baseURL+'/css', express.static(basePath+'/www/css/'));
app.use(baseURL+'/images', express.static(basePath+'/www/images/'));
app.use(baseURL+'/fonts', express.static(basePath+'/www/fonts/'));

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

    // console.log('WebSocket connection accepted');

    ws.on('message',function(message, flags){
        // console.log('WebSocket message received',message);
        
        if (!message) { 
            // console.log('WebSocket empty message');
            ws.send('Error: malformed request');
            return false; 
        }

        if (message === 'ping') return ws.send('pong');

        var data = JSON.parse(message);
        if (!data) {
            // console.log('WebSocket bad message');
            ws.send('Error: malformed request');
            return false; 
        }
        
        // console.log('Trying method:', data.method);

        if (WSAPI[data.method]) {
            var args = [];
            if(data.args) {
                data.args.forEach(function(item){
                    args.push(item);
                });
            }
            args.push(function(event, err, body){
                // console.log('Send response');
                ws.send(JSON.stringify({
                    event: event,
                    msig: data.msig || null,
                    err:err,
                    body:body
                }));
            });
            args.push(ws)
            // console.dir(args);
            WSAPI[data.method].apply(this, args);
        } else {
            // console.log('Method '+data.method+' does not exist');
            ws.send('Error: malformed request');
            return false;         	
        }
    });

    ws.on('close',function(connection){
    	// clients.slice(clients.indexOf(connection),1);
        // console.log('Websocket connection closed');
    });
});


feed.on('change', function (change) {
    DataManager.refresh();
});
feed.follow();

http.listen(http_port);

exports.DataManager = DataManager;