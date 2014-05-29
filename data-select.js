var fs = require('fs');
var util = require('util');
var path = require('path');
var express = require('express');
var app = new express();
var http = require('http').createServer(app);
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: http });
var async = require('async');
var mysql = require('mysql');
var dnode = require('dnode');

var dnode_port = 8122;
var http_port = 8092;

var config = require("./selectors.json");

var connections = {};

var Select = {};

config.dsn.forEach(function(item){
	connections[item.key] = mysql.createConnection(item.uri);
	connections[item.key].connect(function(err){
		if (err) {
			console.trace(err);
			return;
		}
	})
});

config.selectors.forEach(function(item){
	Select[item.key] = function(options, callback){

		// if (item.modifiers)
		if (item.modifiers || item.limit) {
			var q = util.format(item.query, options.PropGeo1, options.limit);
			console.log(options);
		} else var q = item.query;

		console.log(q);
		var res = connections[item.dsn].query(q,function(err,results){

			var package = {
				modifiers: item.modifiers,
				columns: item.columns,
				selection: results,
				summary: items.summary
			};
			callback(err,package);
		});
	};
});


app.use(function(req, res, next){

  var u = require('url').parse(req.url, true);
  var c = u.pathname.replace('/','');
  if (typeof Select[c] !== undefined) {
  	Select[c](u.query, function(err,results){
  		if (err) {
  			res.send(JSON.stringify(err));
  		} else {
  			res.send(JSON.stringify(results));
  		}
  	})
  }
});

var dserver = dnode(Select);

dserver.listen(dnode_port);
http.listen(http_port);

exports.Select = Select;