var HoneyBadger = (function($this){
	return $this;
}(HoneyBadger||{}));
+(function($this){
	$this.source = function(id){
		return {
			create:function(){},
			read:function(){},
			update:function(){},
			delete:function(){}
		};
	};
	return $this;
}(HoneyBadger||{}));
/**
 * quick lifted promises
 * https://gist.github.com/softwaredoug/9044640
 */
var Promise = function(wrappedFn, wrappedThis) {
  this.then = function(wrappedFn, wrappedThis) {
    this.next = new Promise(wrappedFn, wrappedThis);
    return this.next;
  };
    
  this.run = function() {
    wrappedFn.promise = this;
    wrappedFn.apply(wrappedThis);
  };
    
  this.complete = function() {
    if (this.next) {
      this.next.run();
    }
  };
};
 
Promise.create = function(func) { 
  if (func.hasOwnProperty('promise')) { 
    return func.promise;
  } else { 
    return new Promise();
  } 
};

/**
 * This little guy might help organize things later
 * @param {object} context
 */
var Emitter = function (context){

  var _register = [];
  context.on = function(event, callback) {
    var s = _register.map(function(i){
      if (i.event !== event && i.context !== context && i.callback !== callback) return i;
    });
    if (!s.length) _register.push({
      event: event,
      context: context,
      callback: callback
    });
  };

  var _emit = function(event, data, context){
    for (var i=0; i<_register.length; i++) {
      if (_register[i].event === event && _register[i].context) _register[i].callback(data)
    }
  };

  return function Emit(event, data){
    _emit(event,data,context);
  }
};
