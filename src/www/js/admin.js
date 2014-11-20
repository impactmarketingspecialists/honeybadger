HoneyBadger.Admin = (function($this,$){
	var self = this,
		sources = [],
		extractors = [],
		transformers = [],
		loaders = [],
		__inits = [],
		__modules = {};

	$this.Admin = this;

	var _construct = function() {
		console.log('Admin constructor');
		$this.pm('a message from the Admin module');
	};

	var _init = function() {
		// honeybadger doesn't have jquery hooks, but we do!
		$(document).ready(function(){

			// Pre-initializing any modules on DOM ready

			for(var i=0; i<__inits.length; i++) {
				__inits[i]();
			}

			// Post initializing all modules on DOM ready
			console.log('Admin DOM READY');
		});
	};

	var _privateMessage = function() {
		console.log('Testing private admin message');
	}

	var _unsealed = function(){
		var o = _sealed();
		o.pm = _privateMessage;
		return o;
	};

	var _registerInitializer = function(callback) {
		__inits.push(callback);
		return _unsealed();
	};

	var _sealed = function(){
		return {
			module:{
				register:function(module, init) {
					if (typeof module.name == undefined || typeof module.instance == undefined) return;
					if (typeof __modules[module.name] == undefined) __modules[module.name] = module.instance
					if (init) init(_registerInitializer);
				}
			},
			init: _init
		};
	}

	// Register our module
	$this.module.register({
		name: 'Admin',
		instance: this
	},function(_registerInit){ // We get back a callback that passes a method to register our real init
		
		// Setup init handler and get back and unsealed version of the parent
		$this = _registerInit(_init); // fires when the parent has been initialized

		// We can do this code now. In the event that our parent waits for DOM ready before firing init
		_construct();
	});

	return _sealed();

}(HoneyBadger||{},jQuery));