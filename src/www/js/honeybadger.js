var HoneyBadger = (function($this){

	var ts,tp,socket,host = "ws://"+location.host+"/admin/";
	var Emit = Emitter(this);

	var self = this;
	var __cbqueue = {},
		__modules = {},
		__inits = [],
		__devmode = ( window.location.host == "localhost:8090" || window.location.host.indexOf('192.168') > -1 ) ? true : false;

	var _sealed = function(){
		return {
			DataManager:{},
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

	var _unsealed = function(){
		var hb = _sealed();
		hb.__devmode = __devmode;
		hb.on = self.on;
		hb.exec = _exec;
		return hb;
	};

	var _registerInitializer = function(callback) {
		__inits.push(callback);
		return _unsealed();
	};

	console.log('HoneyBadger starting up');
	var _init = function() {
		console.log('HoneyBadger initializing');
		
		connect();

		console.log('HoneyBadger initializing submodules');
		for(var i=0; i<__inits.length; i++) {
			__inits[i]();
		}
		console.log('HoneyBadger initializing complete!');
	}

	var connect = function() {
		if (ts) clearInterval(ts);
		if (tp) clearInterval(tp);

		socket = new WebSocket(host);
		socket.onopen = function(){
			if (ts) clearInterval(ts);
			tp = setInterval(function(){
				socket.send('ping');
			}, 15000);
			Emit('readyStateChange',1);
		};

		socket.onclose = function(){
			if (tp) clearInterval(tp);
			ts = setInterval(connect, 1000);
		};

		socket.onmessage = receive;
		return socket;
	};

	var send = function(method, args, callback){
		var args = args || [];
		var msig = (callback) ? (new Date().getTime() * Math.random(1000)).toString(36) : null;
		if (msig) { __cbqueue[msig] = callback }
		if( __devmode ){ console.trace(); console.dir({method:method,msig:msig,args:args}); }
		socket.send(JSON.stringify({method:method,msig:msig,args:args}));
	};

	var receive = function(e) {

		if( __devmode ){ console.dir(e.data); }
		if (e.data === 'pong') return;

		var d = JSON.parse(e.data);
		var msig = d.msig || null;
		if (msig && __cbqueue[msig]) {
			__cbqueue[msig](d);
			delete __cbqueue[msig];
			return;
		}

		if (d.event == 'log-stream') {
			// $('#'+d.target).append(d.body);
		}
	};


	var _exec = function(method, args, callback){
		send(method, args, callback);
	}

	return _sealed();
}(HoneyBadger||{}));