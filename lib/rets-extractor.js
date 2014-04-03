var util = require('util');
var events = require('events');
var librets = require('rets-client');

var rets = function()
{
	events.EventEmitter.call(this);
	var self = this;

	var client = librets.createConnection({
		// host: 'carets.retscure.com',
		// port: '6103',
		// path: '/platinum/login',
		// user: 'CARIMPACTMKTSPECIAL',
		// pass: 'carets632',
		// version: '1.5',
		// agent: { user: 'CARETS-General/1.0' }
	});

	client.once('connection.success',function(client){
		console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
		self.emit('connect',client);
	});

	client.once('connection.error',function(error, client){
		console.error( 'Connection failed: %s.', error.message );
	});
};

util.inherits(rets,events.EventEmitter);
exports.rets = rets;