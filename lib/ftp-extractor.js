var util = require('util');
var events = require('events');
var libftp = require('ftp');

var ftp = function()
{
	events.EventEmitter.call(this);
	var self = this;

	var client = new libftp().
	client.connect({
		// host: 'carets.retscure.com',
		// port: '6103',
		// path: '/platinum/login',
		// user: 'CARIMPACTMKTSPECIAL',
		// pass: 'carets632',
		// version: '1.5',
		// agent: { user: 'CARETS-General/1.0' }
	});

	client.on('ready',function(client){
		console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
		self.emit('connect',client);
	});

	client.on('connection.error',function(error, client){
		console.error( 'Connection failed: %s.', error.message );
	});
};

util.inherits(rets,events.EventEmitter);
exports.rets = rets;