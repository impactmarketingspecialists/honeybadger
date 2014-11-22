var ftp = require('../lib/helpers/transports/ftp');

Object.defineProperties(module.exports,{
	get: {
		value: function(source, target, callback){
			ftp.get(source, target, callback);
		},
		enumerable: true
	}
});
