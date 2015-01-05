var util = require('util');
var events = require('events');
var url = require('url');
var librets = require('rets-client');

var clients = {};

var rets = function( options, callback )
{
    var self = this;

 	// events.EventEmitter.call(this);
    var uri = url.parse(options.source.uri);

    var client_key = uri.hostname+uri.port+':'+options.source.auth.username;

    if (!clients[client_key]) {
        var client = librets.createConnection({
            host: uri.hostname,
            port: uri.port,
            protocol: uri.protocol,
            path: uri.path,
            user: options.source.auth.username,
            pass: options.source.auth.password,
            version: options.source.version || '1.7.2',
            agent: { user: options.source.auth.userAgentHeader, password: options.source.auth.userAgentPassword }
        });
    }

    // var client = clients[client_key];
    // console.log(clients);

    client.once('connection.success',function(client){
        console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );

        self.emit('connect', null, 'success');

        var qry = {
            SearchType: options.target.type,
            Class: options.target.class,
            Query: options.target.res,
            Format: 'COMPACT-DECODED',
            Limit: 10
        };

        client.searchQuery(qry, function( error, data ) {

            // console.log(error, data);
            
            if (error) {
                console.log(data);
            } else if (data.type == 'status') {
                // clog('<div class="text-warning">'+data.text+'</div>');
                // if (!data.data || !data.data.length) clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
            } else {
                if (!data.data || !data.data.length) {
                    // clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                    return;
                }

    			self.emit('data', data);
            }
        });
    });

    client.once('connection.error',function(error, client){
        console.error( 'Connection failed: %s.', error.message );
        callback('onLoaderTest',error, null);
    });

};

util.inherits( rets, extractor );

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
      console.log('Init')
      return new rets( settings, callback || utility.noop )
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});
