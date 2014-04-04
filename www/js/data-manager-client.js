var ts;
var socket;
var host = "ws://"+location.hostname+":8090/";

var events = {
	onsave: function(res){
	},
	onlist: function(res){
	},
	onload: function(res){
	},
	ondestroy: function(res){
	}
};

function connect()
{
	if (ts) clearInterval(ts);
	socket = new WebSocket(host);
	socket.onopen = function(){
		console.log('connected');
		// update('connectionStatus',{online:true});
		// init();
		if (ts) clearInterval(ts);
	};
	socket.onmessage = function(msg){
		console.log(msg.data);
		var d = JSON.parse(msg.data);
		var e = d.event;
		if (events[e]) events[e](d)
		// if (d.status) update('statusbar',d.status);
		// if (d.status && d.status.tasks) update('indicators',{active:d.status.tasks.active.length, completed:d.status.tasks.complete.length});
		// if (d.update && d.update.element && d.update.data) update(element,d.update.data);
		// if (d.receive) receive(d.receive);
		// if (d.info && d.info.msg) info(d.info.msg);
	};
	socket.onclose = function(){
		// update('connectionStatus',{online:false});
		ts = setInterval(connect, 5000);
	};
}

var DataManager = new (function(){

	this.reset = function(){
	};

	this.list = function(id){
		socket.send(JSON.stringify({method:'list'}));
	};

	this.load = function(id){
		socket.send(JSON.stringify({method:'load',args:[id]}));
	};

	this.destroy = function(id,rev){
		if (confirm('Are you sure?')) socket.send(JSON.stringify({method:'destroy',args:[id,rev]}));
	};

	this.save = function(){
	};

})();

connect();