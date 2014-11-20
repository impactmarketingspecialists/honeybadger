var libftp = require('ftp');

Object.defineProperties(module.exports,{
	browse: {
		value: function(source, callback){
			var c = new libftp();

			c.on('ready', function() {
				c.list(function(err, list) {
					c.end();
					process.nextTick(function(){
						callback(err, list);
					});
				});
			});

			c.on('error', function(err) {
				console.trace(err);
				process.nextTick(function(){
					callback(err, null);
				});
			});

			c.connect({
				host: source.uri,
				port: source.port,
				user: source.auth.username,
				password: source.auth.password
			});
		},
		enumerable: true
	},
	get: {
		value: function(source, target, callback){
			var c = new libftp();

			c.on('ready', function() {
				c.get(target, function(err, stream){
					stream.once('close', function(){ 
						c.end(); 
					});
					callback(err, stream);
				});
			});

			c.on('error', function(err) {
				console.trace(err);
				process.nextTick(function(){
					callback(err, null);
				});
			});

			c.connect({
				host: source.uri,
				port: source.port,
				user: source.auth.username,
				password: source.auth.password
			});
		},
		enumerable: true
	}
});