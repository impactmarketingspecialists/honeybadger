+(function($this){
	var self = this,
		sources = [],
		extractors = [],
		transformers = [],
		loaders = [];

	var _construct = function() {
		console.log('DataManager constructor');
		$this.on('readyStateChange',function(readyState){
			if (readyState === 1) {
				Emit('ready',true);
				self.refresh();
			}
		});
	};

	var _init = function() {
		console.log('DataManager initialized');
	};

	$this.module.register({
		name: 'DataManager',
		instance: this
	},function(_unsealed){
		$this = _unsealed(_init); 
		_construct();
	});

	var Emit = new Emitter(this);
	HoneyBadger.DataManager = this;

	this.loadSources = function(callback){
		var promise = Promise.create(self.loadSources);
		$this.exec('list',null,function(e){
			if (!e.err) { sources = e.body; }
			if (callback) callback(e);
			Emit('sources',sources);
			promise.complete();
		});
		return promise;
	};

	this.loadExtractors = function(callback){
		var promise = Promise.create(self.loadExtractors);
		$this.exec('getExtractorList',null,function(e){
			if (!e.err) { extractors = e.body; }
			if (callback) callback(e);
			Emit('extractors',extractors);
			promise.complete();
		});
		return promise;
	};

	this.loadTransformers = function(callback){
		var promise = Promise.create(self.loadTransformers);
		$this.exec('getTransformerList',null,function(e){
			if (!e.err) { transformers = e.body; }
			if (callback) callback(e);
			Emit('transformers',transformers);
			promise.complete();
		});
		return promise;
	};

	this.loadLoaders = function(callback){
		var promise = Promise.create(self.loadLoaders);
		$this.exec('getLoaderList',null,function(e){
			if(!e.err) { loaders = e.body; }
			if (callback) callback(e);
			Emit('loaders',loaders);
			promise.complete();
		});
		return promise;
	};

	this.refresh = function(callback){
		//TODO: add parallelized promises
		this.loadSources().then(this.loadExtractors).then(this.loadTransformers).then(this.loadLoaders).then(function(){
			if (callback) callback();
			Emit('refresh',{
				sources: sources,
				extractors: extractors,
				transformers: transformers,
				loaders: loaders
			});
		});
	};

	this.getSources = function(){
		return sources;
	};

	this.getExtractors = function(){
		return extractors;
	};

	this.getTransformers = function(){
		return transformers;
	};

	this.getLoaders = function(){
		return loaders;
	};

	this.getSource = function(id){
		return self.getSources().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getExtractor = function(id){
		return self.getExtractors().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getTransformer = function(id){
		return self.getTransformers().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getLoader = function(id){
		return self.getLoaders().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.source = function(name, type, properties){

	};

	this.extractor = {};
	this.extractor.validate = function(){

	};

	this.extractor.save = function(ext){
		$this.exec('saveExtractor', [ext], function(e){
			console.log(e);
		});
	};

	this.extractor.sample = function(ext, cb){
		$this.exec('testExtractor', [ext], function(e){
			cb(e);
		});
	};

	this.transformer = {};
	this.transformer.validate = function(){

	};

	this.transformer.save = function(trn){
		$this.exec('saveTransformer', [trn], function(e){
			console.log(e);
		});
	};

	this.transformer.sample = function(trn, cb){
		$this.exec('testTransformer', [trn], function(e){
			cb(e);
		});
	};

	this.loader = {};
	this.loader.validate = function(){

	};

	this.loader.validateConnection = function(ldr, cb){
		$this.exec('validateLoaderConnection', [ldr], function(e){
			cb(e);
		});
	};

	this.loader.createSchema = function(ldr, cb){
		$this.exec('createLoaderSchema', [ldr], function(e){
			cb(e);
		});
	};

	this.loader.save = function(ldr){
		$this.exec('saveLoader', [ldr], function(e){
			// console.log(e);
			cb(e);
		});
	};

	this.loader.sample = function(ldr, cb){
		$this.exec('testLoader', [ldr], function(e){
			cb(e);
		});
	};

	this.validateSource = function(source, callback){
		$this.exec('validateSource', [source], callback);
	};

	this.saveSource = function(source, callback){
		$this.exec('saveSource', [source], callback);
	};

}(HoneyBadger||{}));