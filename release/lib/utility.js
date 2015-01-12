Object.defineProperties(module.exports, {
	dsn: {
		value: function parseDSN(dsn) {
			var args;
			var components = require('url').parse(dsn);

			var mysql = function(){
				var hostname = components.hostname,
					port = components.port,
					auth = components.auth.split(':'),
					user = auth.shift(),
					password = auth.shift(),
					database = components.pathname ? components.pathname.substr(1).replace(/\/.*$/, '').replace(/\?.*$/, '') : null,
					socket = null,
					flags = null;

				return { host: hostname, user: user, password: password, database: database, port: port, socket: socket, flags: flags };
			};

			var ftp = function(){
				var hostname = components.hostname,
					port = components.port || 21,
					auth = components.auth.split(':'),
					user = auth.shift(),
					password = auth.shift()
					path = components.path;

				return { host: hostname, user: user, password: password, port: port, path: path };
			};

			if (components.hostname) {
				switch(components.protocol)
				{
					case 'mysql:':
						args = mysql();
					break;
					case 'ftp:':
						args = ftp();
					break;
					default:
						throw new Error('Not implemented');
				}
			}
			else args = [arguments[0]];
			return args;
		},
		enumerable: true,
		configurable: true,
		writeable: true
	},
	noop: {
		value: function noop() {},
		enumerable: true,
		configurable: true,
		writable: true
	}
});