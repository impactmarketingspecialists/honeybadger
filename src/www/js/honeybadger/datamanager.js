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
		$this.exec('source.list',null,function(e){
			if (!e.err) { sources = e.body; }
			if (callback) callback(e);
			Emit('sources',sources);
			promise.complete();
		});
		return promise;
	};

	this.loadExtractors = function(callback){
		var promise = Promise.create(self.loadExtractors);
		$this.exec('extractor.list',null,function(e){
			if (!e.err) { extractors = e.body; }
			if (callback) callback(e);
			Emit('extractors',extractors);
			promise.complete();
		});
		return promise;
	};

	this.loadTransformers = function(callback){
		var promise = Promise.create(self.loadTransformers);
		$this.exec('transformer.list',null,function(e){
			if (!e.err) { transformers = e.body; }
			if (callback) callback(e);
			Emit('transformers',transformers);
			promise.complete();
		});
		return promise;
	};

	this.loadLoaders = function(callback){
		var promise = Promise.create(self.loadLoaders);
		$this.exec('loader.list',null,function(e){
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

	this.extractor.save = function(ext, callback){
		$this.exec('extractor.save', [ext], callback);
	};

	this.extractor.sample = function(ext, callback){
		$this.exec('extractor.test', [ext], callback);
	};

	this.transformer = {};
	this.transformer.validate = function(trn, callback){

	};

	this.transformer.save = function(trn, callback){
		$this.exec('transformer.save', [trn], callback);
	};

	this.transformer.sample = function(trn, callback){
		$this.exec('transformer.test', [trn], callback);
	};

	this.loader = {};
	this.loader.validate = function(){

	};

	this.loader.validateConnection = function(ldr, callback){
		$this.exec('validateLoaderConnection', [ldr], callback);
	};

	this.loader.createSchema = function(ldr, callback){
		$this.exec('createLoaderSchema', [ldr], callback);
	};

	this.loader.save = function(ldr, callback){
		$this.exec('loader.save', [ldr], callback);
	};

	this.loader.sample = function(ldr, callback){
		$this.exec('loader.test', [ldr], callback);
	};

	this.validateSource = function(source, callback){
		$this.exec('source.test', [source], callback);
	};

	this.saveSource = function(source, callback){
		$this.exec('source.save', [source], callback);
	};

	this.ftpBrowse = function(source, callback)
	{
		$this.exec('ftp.browse',[source],callback);
	};

	this.retsExplore = function(source, callback)
	{
		$this.exec('rets.getClassifications',[source],callback);
	};

	this.retsBrowse = function(source, callback)
	{
		$this.exec('rets.getMetadataResources',[source],callback);
	};

	this.retsInspect = function(source, callback)
	{
		$this.exec('rets.getMetadataTable',[source],callback);
	};

}(HoneyBadger||{}));