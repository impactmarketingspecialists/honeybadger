
+(function($,$this){
	if (typeof window.HoneyBadger == undefined) window.HoneyBadger = $this;

	var _self = this, _modules = {};

	$this.registerModule = function(module){
		if (typeof module.name == undefined || typeof module.instance == undefined) return;
		_modules[module.name] = module.instance;
	};

}(jQuery,HoneyBadger||{}));
