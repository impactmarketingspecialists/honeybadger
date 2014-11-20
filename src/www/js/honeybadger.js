var HoneyBadger = (function($this){

	var ts,tp,socket,host = "ws://"+location.host+"/admin/";
	// var Emit = Emitter(this);

	var self = this;
	var __cbqueue = {},
		__modules = {},
		__inits = [],
		sources = [],
		extractors = [],
		transformers = [],
		loaders = [],
		localDev = ( window.location.host == "localhost:8090" ) ? true : false;

	function connect()
	{
		if (ts) clearInterval(ts);
		if (tp) clearInterval(tp);

		socket = new WebSocket(host);
		socket.onopen = function(){
			// update('connectionStatus',{online:true});
			if (ts) clearInterval(ts);
			tp = setInterval(function(){
				socket.send('ping');
			}, 15000);
		};

		socket.onclose = function(){
			if (tp) clearInterval(tp);
			ts = setInterval(connect, 1000);
		};

		return socket;
	}


	var receive = function(e) {
		if (e.data === 'pong') return;

		var d = JSON.parse(e.data);
		if( localDev ){ console.dir( d ); }
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

	var send = function(method, args, callback){
		var args = args || [];
		msig = (callback) ? (new Date().getTime() * Math.random(1000)).toString(36) : null;
		if (msig) { __cbqueue[msig] = callback }
		if( localDev ){ console.trace(); console.dir({method:method,msig:msig,args:args}); }
		socket.send(JSON.stringify({method:method,msig:msig,args:args}));
	};


	var _exec = function(method, args, callback){
		send(method, args, callback);
	}

	var _private = function(message){
		console.log(message);
	}

	var _unsealed = function(){
		var hb = _sealed();
		hb.exec = _exec;
		hb.pm = _private;
		return hb;
	};

	var _registerInitializer = function(callback) {
		__inits.push(callback);
		return _unsealed();
	}

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
			init: function(){
				for(var i=0; i<__inits.length; i++) {
					__inits[i]();
				}
			}
		};
	}

	return _sealed();
}(HoneyBadger||{}));