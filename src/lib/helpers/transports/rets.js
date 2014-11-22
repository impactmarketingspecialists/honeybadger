var librets = require('rets-client');

Object.defineProperties(module.exports,{
	validate: {
		value: function(source, callback){
            var uri = url.parse(source.uri);

            var client = librets.createConnection({
                host: uri.hostname,
                port: uri.port,
                protocol: uri.protocol,
                path: uri.path,
                user: source.auth.username,
                pass: source.auth.password,
                version: source.version || '1.7.2',
                agent: { user: source.auth.userAgentHeader, password: source.auth.userAgentPassword }
            });

            client.once('connection.success',function(client){
                console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                callback(null, client);
            });

            client.once('connection.error',function(error, client){
                console.error( 'Connection failed: %s.', error.message );
                callback(error, null);
            });
		},
		enumerable: true
	},
	browse: {
		value: function(source, callback){
		},
		enumerable: true
	},
	get: {
		value: function(source, target, callback){
		},
		enumerable: true
	},
	put: {
		value: function(source, target, callback){
		},
		enumerable: true
	}
});
