var util = require('util');
var events = require('events');
var url = require('url');
var librets = require('rets-client');

var rets = function( options )
{
    var self = this;

    var uri = url.parse(options.source.uri);

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

    client.once('connection.error',function(error, client){
        console.trace( 'Connection failed: %s.', error.message );
        rets.debug( 'Connection failed: %s.', error.message );
        self.emit('error', error);
    });

    client.once('connection.success',function(client){
        rets.debug( 'Connected to RETS as %s.', client.get( 'provider.name' ) );

        self.emit('connect', null, 'success');

        var qry = {
            SearchType: options.target.type,
            Class: options.target.class,
            Query: options.target.res,
            Format: 'COMPACT-DECODED',
            Limit: 10
        };

        client.searchQuery(qry, function( error, data ) {

            // rets.debug(error, data);
            
            if (error) {
                rets.debug(error, data);
                self.emit('error', error, data);
                return;
            } else if (data.type == 'status') {
                rets.debug(data);
                if (!data.data || !data.data.length) {
                    rets.debug(data.text+'\nJust because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.');
                    self.emit('error', 'No records');
                    return;
                }
            } else if (!data.data || !data.data.length) {
                rets.debug(data.text+'\nJust because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.');
                self.emit('error', 'No records');
                return;
            }

            self.emit('data', data);
        });
    });


};

util.inherits( rets, extractor );

/**
 * Public static methods.
 *
 */
Object.defineProperties( module.exports = rets, {
  debug: {
    value: require( 'debug' )( 'honeybadger:extractor:rets' ),
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
