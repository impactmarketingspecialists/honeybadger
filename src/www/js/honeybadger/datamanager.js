+(function($this){
	var self = this,
		sources = [],
		extractors = [],
		transformers = [],
		loaders = [];


	var _construct = function() {
		console.log('DataManager constructor');
		$this.on('readyStateChange',function(readyState){
			if (readyState === 1) self.refresh();
		});
	};

	var _init = function() {
		console.log('DataManager initialized');
	};

	this.getSourceList = function(id, callback){
		console.log('Requesting sources');
		$this.exec('list',null,function(e){
			if (!e.err) { sources = e.body; }
			if (callback) callback(e);
		});
	};

	this.getExtractorList = function(){
		$this.exec('getExtractorList',null,function(e){
			if(!e.err) { extractors = e.body; }
		});
	};

	this.getTransformerList = function(){
		$this.exec('getTransformerList',null,function(e){
			if(!e.err) {
				transformers = e.body;
				// update('transformerLists', transformers);
			}
		});
	};

	this.getLoaderList = function(){
		$this.exec('getLoaderList',null,function(e){
			if(!e.err) {
				loaders = e.body;
				// update('loaderLists', loaders);
			}
		});
	};

	this.refresh = function(){
		this.getSourceList();
		// this.getExtractorList();
		// this.getTransformerList();
		// this.getLoaderList();
	};

	this.getSource = function(id){
		return DataManager.getSources().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getExtractor = function(id){
		return DataManager.getExtractors().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getTransformer = function(id){
		return DataManager.getTransformers().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getLoader = function(id){
		return DataManager.getLoaders().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
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
			// console.log(e);
			cb(e);
		});
	};

	$this.module.register({
		name: 'DataManager',
		instance: this
	},function(_unsealed){
		// Initialize module
		$this = _unsealed(_init); // fire constructor when DOM ready
		_construct();
	});

}(HoneyBadger||{}));