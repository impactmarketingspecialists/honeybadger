var Admin = (function($this,$){
	var self = this,

		/**
		 * Since we can extend this with submodules we need
		 * to store references to their initializers
		 * @type {Array}
		 */
		__inits = [],

		/**
		 * We're storing references to submodules that register
		 * themselves.
		 * @type {Object}
		 */
		__modules = {};

	/**
	 * This our public object interface
	 *
	 * Since you can extend this module we include module.register()
	 * This allow submodules to register themselves for access to protected methods
	 * 
	 * @return {object} Public interface for HoneyBadger.Admin
	 */
	var _sealed = function(){
		return {
			module:{
				register:function(module, init) {
					if (typeof module.name == undefined || typeof module.instance == undefined) return;

					/**
					 * Submodules can pass a reference to anything they want as their instance.
					 * This can be reference to itself (pass this,self,whatever), or their public interface
					 * The register what the parent thinks is the submodule; not necessarily what their
					 * public interface looks like.
					 */
					if (typeof __modules[module.name] == undefined) __modules[module.name] = module.instance

					/**
					 * If an initializer is passed, let's register it so it will get call when this module inits
					 */
					if (init) init(_registerInitializer);
				}
			},
			/**
			 * In this case we don't really want to do our own thing with our public init() method.
			 * We've registered ourselves as a submodule of HoneyBadger - so we just want to call
			 * HoneyBadger's init - we have nothing special to add.
			 *
			 * To initialize this module you can call Admin.init() - since we've declared this module as Admin
			 * in the global scope.
			 *
			 * However, since it's a submodule of HoneyBadger, you can also call HoneyBadger.init() - our _init()
			 * our _init() will get fired by that. Technically that's all you're really doing by calling Admin.init()
			 * since we assign it to the same reference below.
			 *
			 * Since our submodule registers itself with HoneyBadger as HoneyBadger.Admin you can also call
			 * HoneyBadger.Admin.init(). It's all the same thing!
			 * 
			 * @type {Funtion} Our public init() method.
			 */
			init: function() { console.log($this); $this.init; } // we'll just call our parent's init to make sure HoneyBadger connects fire up modules
		};
	}

	/**
	 * This is our protected interface
	 *
	 * This interface is offered to submodules via _registerInitializer().
	 * We simply extend the public interface with whatever additional methods
	 * we want to expose to submodules.
	 * 
	 * @return {object} Protected interface for HoneyBadger.Admin
	 */
	var _unsealed = function(){
		var o = _sealed();
		o.hb = $this;
		return o;
	};

	/**
	 * Registers a submodules initializer to make sure that when this
	 * module gets initialized, any submodules will also get initialized
	 * 
	 * @param  {Function} callback Reference to registering submodule's initializer
	 * @return {object} Protected interface for HoneyBadger.Admin
	 */
	var _registerInitializer = function(callback) {
		__inits.push(callback);
		return _unsealed();
	};

	/**
	 * Our module's actual constructor
	 * This happens immediately before any initialization
	 * 
	 * @return {void} Constructor
	 */
	var _construct = function() {
		console.log('Admin constructor');
	};

	/**
	 * Our module's initializer.
	 * This gets called via our public init() method.
	 *
	 * Since we've registered as a submodule of HoneyBadger
	 * this gets fired whenever HoneyBadger initializes all
	 * of it's submodules - that's why our public init()
	 * method is actually just calling HoneyBadger.init()
	 *
	 * The HoneyBadger module doesn't care about the UI
	 * So it's just inits all of its submodules right away.
	 * In the case of this module, we do care about the
	 * DOM, so we will wait for DOM to fire ready before
	 * initializing any submodules.
	 *
	 * Any submodules of Admin will have their _construct()
	 * fire immediately as they register and their _init()
	 * fire after DOM ready.
	 * 
	 * @return {void} Initializer
	 */
	var _init = function() {

		if ($this.__devmode) {
			/**
			 * Add the livereload script - we'll add it manually so
			 * that you don't need the browser plugin and you can do
			 * it from across hosts.
			 */
			$(document.body).append('<script src="http://'+document.location.hostname+':35729/livereload.js?snipver=1"></script>');
		}
		

		// HoneyBadger doesn't use jQuery, but the Admin does
		$(document).ready(function(){

			console.log('DOM READY');
			/** 
			 * Pre-initializing any modules on DOM ready
			 * You can do some work here before you fire
			 * _init() on all the submodules.
			 */

			/**
			 * Let's init those submodules
			 */
			for(var i=0; i<__inits.length; i++) {
				__inits[i]();
			}

			/**
			 * Anything else you want to do after you've initialized submodules?
			 */
			
			console.log('Admin initialized');
		});
	};


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

	HoneyBadger.Admin = _sealed();
	return {
		init: HoneyBadger.init
	};

}(HoneyBadger,jQuery));