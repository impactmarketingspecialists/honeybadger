var fs = require('fs');
var path = require('path');
var url = require('url');
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
	Select[item.key] = function(callback){
		var res = connections[item.dsn].query(item.query,function(err,results){
			callback(err,results);
		});
	};
});


app.use(function(req, res, next){
  var url = req.url.replace('/','');
  if (typeof Select[url] !== undefined) {
  	Select[url](function(err,results){
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