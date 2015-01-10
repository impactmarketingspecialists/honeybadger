var libftp = require('ftp');

Object.defineProperties(module.exports,{
	validate: {
		value: function(source, callback){
	        var c = new libftp();

	        c.on('ready', function() {
	            c.list(function(err, list) {
	              if (err) {
	                process.nextTick(function(){
	                    callback(err,null);
	                });
	                return;
	              }
	              c.end();
	              process.nextTick(function(){
	                callback(null,{success:true})
	              })
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
	browse: {
		value: function(source, callback){
			var c = new libftp();

			var basepath = source.basepath || '/';

			c.on('ready', function() {
				c.list(basepath, function(err, list) {
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
					if (!err) stream.once('close', function(){
						console.log('closing ftp data stream');
						c.end(); 
					});
					// process.nextTick(function(){
					if (callback) callback(err, stream);
					// });
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
	put: {
		value: function(stream, source, target, callback){
			var Client = require('ftp');
			var c = new Client();

			stream.on('finish', function(){
				// console.log('outstream_finished')
				// c.end();
			});

			c.on('ready', function() {
				c.put(stream, target, function(err){
					c.end();
				});
			});

			c.on('close', function(){
				console.log('complete');
				c.destroy();
				callback(null, true);
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
