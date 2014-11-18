Object.defineProperties(module.exports, {
	dsn: {
		value: function parseDSN(dsn) {
			var args;
			var components = require('url').parse(dsn);

			if (components.hostname) {
				if (components.protocol !== 'mysql:') {
					throw new Error("only doing mysql for now");
				}

				var hostname = components.hostname,
					port = components.port,
					auth = components.auth.split(':'),
					user = auth.shift(),
					password = auth.shift(),
					database = components.pathname ? components.pathname.substr(1).replace(/\/.*$/, '').replace(/\?.*$/, '') : null,
					socket = null,
					flags = null;

				args = { host: hostname, user: user, password: password, database: database, port: port, socket: socket, flags: flags };
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