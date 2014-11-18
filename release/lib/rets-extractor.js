var util = require('util');
var events = require('events');
var librets = require('rets-client');

function rets( options, callback )
{
	// protect scope and eliminate need for new constructor
	if( !( this instanceof RETS ) ) {
		return new rets( options, callback );
	}

 	events.EventEmitter.call(this);

    this._librets = require('rets-client');

    var uri = url.parse(src.source.uri);

    var client = librets.createConnection({
        host: uri.hostname,
        port: uri.port,
        protocol: uri.protocol,
        path: uri.path,
        user: src.source.auth.username,
        pass: src.source.auth.password,
        version: src.source.version || '1.7.2',
        agent: { user: src.source.auth.userAgentHeader, password: src.source.auth.userAgentPassword }
    });

    clog('<div class="text-info">Connecting to RETS data source.</div>');
    client.once('connection.success',function(client){
        console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
        clog('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>');
        clog('<div class="text-info">Extracting 1000 records via DMQL2 RETS Query.</div>');
        clog('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
        clog('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');
        clog('<div class="text-info">-- Query: '+extractor.target.res+'</div>');
        var qry = options || {
            SearchType: extractor.target.type,
            Class: extractor.target.class,
            Query: extractor.target.res,
            Format: 'COMPACT-DECODED',
            Limit: 1000
        };
        
        client.searchQuery(qry, function( error, data ) {
            clog('<div class="text-success">Successfully retrieved RETS data from provider.</div>');
            
            if (error) {
                clog('<div class="text-danger">Query did not execute.</div>');
                clog('<pre class="text-danger">'+JSON.stringify(error,2)+'</pre>');
            } else if (data.type == 'status') {
                clog('<div class="text-warning">'+data.text+'</div>');
                if (!data.data || !data.data.length) clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
            } else {
                if (!data.data || !data.data.length) {
                    clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                    return;
                }

                clog('<div class="text-info">Parsing extracted records.</div>');
    			self.emit('data', data);
            }
        });
    });

    client.once('connection.error',function(error, client){
        console.error( 'Connection failed: %s.', error.message );
        callback('onLoaderTest',error, null);
    });

    return this;
};

util.inherits( rets, events.EventEmitter );

/**
 * Public static methods.
 *
 */
Object.defineProperties( module.exports = rets, {
  debug: {
    value: require( 'debug' )( 'rets:client' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  initialize: {
    value: function init( settings, callback ) {
      rets.debug( 'Initializing RETS Extractor' );
      return new rets( settings, callback || utility.noop )
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});
