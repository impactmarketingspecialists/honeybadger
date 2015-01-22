// Copyright Impact Marketing Specialists, Inc. and other contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Worker;

/** log facility */
var log = require('debug')('HoneyBadger:Worker');

/** core deps */
var ftp = require('./helpers/transports/ftp');
var rets = require('./helpers/transports/rets');
var csv = require('./helpers/csv');

var Readable = require('stream').Readable;

var DataManager = require('./data-manager');
var Extractor = require('./extractor').Factory;
var BeanCounter = require('./transformer/beancounter');
var Normalizer = require('./transformer/normalize');
var MySQL = require('./loader/mysql');
var Filesystem = require('./loader/filesystem');
var FTPLoader = require('./loader/ftp');

function Worker(options) {

	if (!(this instanceof Worker))
		return new Worker(options);

	var $this = this;

	this.runTask = function(task, callback) {

		if (task.status !== 'active') {
			log('Task is inactive; not running');
			return;
		}
		log('Running task %s', task.name);

		/**
		 * Let's get all the configs we need
		 */

		/** 
		 * Danger!! No error checking - booo... don't forget to add
		 * some sanity checks - don't be a poppin empty arrays;
		 *
		 * We use Object.create here to do something specific; don't be fooled.
		 * We _want_ changes made on original configuration docs to bubble,
		 * however we _don't_ want changes to these configs to affect data-manager.
		 */
		var extractor_config = Object.create(DataManager.extractors.filter(function(item){ if (item.id === task.extractor) return true; }).pop().value);
		log('Loaded task extractor', extractor_config.name);

		var source_config = Object.create(DataManager.sources.filter(function(item){ if (item.id === extractor_config.source) return true; }).pop().value);
		log('Loaded task extraction source', source_config.name);

		var transformer_configs = DataManager.transformers.filter(function(item){ if (item.value.extractor === task.extractor) return true; }).map(function(item){ return Object.create(item.value); });
		log('Discovered', transformer_configs.length, 'transformers');

		var loader_configs = [];
		transformer_configs.forEach(function(transform){
			log('Loaded task transformer', transform.name);

			var loaders = DataManager.loaders.filter(function(item){ if (item.value.transform === transform._id) return true; });
			loaders.forEach(function(loader){
				loader_configs.push(Object.create(loader.value));
			});
		});

		log('Discovered %s loaders', loader_configs.length);

		var loaders_ready = [];

		/**
		 * Let's get some instances of our etl objects
		 */
		var $e = Extractor({
			id: extractor_config._id,
			name: extractor_config.name,
			source: source_config.source,
			target: extractor_config.target
		});

		$e.on('error',function(err, body){
			log('Extractor error:', err, body);
			console.trace(err, body);
		});

		$e.on('ready',function(err, body){
			log('Extractor ready:', extractor_config.name);
			loader_configs.forEach(function(loader_config){
				var transformer_config = transformer_configs.filter(function(item){ if (item._id === loader_config.transform) return true; }).pop();
				var transforms = [];

				log('Loaded task loader %s', loader_config.name)

				var loader = null;
				if (loader_config.target.type == 'mysql')	var loader = new MySQL(loader_config);
				else if (loader_config.target.type == 'file')	var loader = new Filesystem(loader_config);
				else if (loader_config.target.type == 'ftp')	var loader = new FTPLoader(loader_config);

				loader.on('finish', function(){
					log('Loader finished:', loader_config.name);
				});

				loader.on('ready',function(){
					log('Loader ready %s', loader_config.name);
					loaders_ready.push(loader_config.name);

					log('Applying transformer: %s', transformer_config.name);

					/** Normalizer */
					if (loaders_ready.length == loader_configs.length) {
						log('Start extraction');
						$e.start();
					}
				});

				if (transformer_config.transform.normalize.length) {

					var transform = transforms[transformer_config.name] || new Normalizer(transformer_config);
					if (!transforms[transformer_config.name]) transforms[transformer_config.name] = transform;

					// We should probably change this to loader_config.schema; it causes confusion and overrides
					// and existing variable
					loader_config.transform = transformer_config.transform;

					transform.on('finish',function(){
						log('Transformer finished: %s', transformer_config.name);
					});

					// log('Piping data stream to transformer');
					$e.pipe(transform).pipe(loader);
				}
			});
		});

		$e.on('finish',function(err, body){
			log('Finished extraction for: %s', extractor_config.name);
		});

		$e.on('readable',function(){
		});

		$e.on('data',function(data){
		});
	};
}
