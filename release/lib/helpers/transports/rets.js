var url = require('url');
var librets = require('rets-client');

Object.defineProperties(module.exports,{
	connect: {
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
                // console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                callback(null, client);
            });

            client.once('connection.error',function(error, client){
                // console.error( 'Connection failed: %s.', error.message );
                callback(error, null);
            });
		},
		enumerable: true
	},
	validate: {
		value: function(source, callback){
            this.connect(source, function(err, client){
            	if (!client) {
	                console.error( 'Connection failed: %s.', error.message );
	                callback(error, null);
            	}
            	else {
	                console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
	                callback(null, client);
            	}
            });
		},
		enumerable: true
	},
	getClassifications: {
		value: function(source, callback, client) {
			if (client) client.getClassifications( source.rets.resource, callback);
			else {
		        this.connect(source, function(error,client){
		            client.getClassifications( source.rets.resource, callback);
		        });
			}
		},
		enumerable: true
    },
    getMetadataResources: {
    	value: function(source, callback, client) {
			if (client) client.getMetadataResources('0', callback);
			else {
		        this.connect(source, function(error,client){
		            client.getMetadataResources('0', callback);
		        });
			}
		},
		enumerable: true
    },
    getMetadataTable: {
    	value: function(source, callback, client) {
			if (client) client.getMetadataTable(source.rets.resource, source.rets.classification, callback);
			else {
		        this.connect(source, function(error,client){
		            client.getMetadataTable(source.rets.resource, source.rets.classification, callback);
		        });
			}
		},
		enumerable: true
    },
    query: {
    	value: function(_type, _class, _query, _limit, callback, client) {
	        // Fetch classifications
	        client.searchQuery({
	            SearchType: _type || 'Property',
	            Class: _class || 'A',
	            Query: _query || '(status=Listed)',
	            Limit: _limit || 10
	        }, function( error, data ) {
	            console.log( require( 'util' ).inspect( data, { showHidden: false, colors: true, depth: 5 } ) )
	        });
	    },
	    enumerable: true
    },
    getObject: {
    	value: function(){
    		client.getMetadataObjects('Property',function(meta){
    			console.log('Got object metadata');
    			console.log(meta);
	    		// client.getObject('Property','PHOTO','','*',0,function(res){
	    		// 	console.log('getObject Callback');
	    		// 	console.log(res);
	    		// });
    		})
    	},
    	enumerable: true
    }
});
