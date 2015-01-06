var ftp = require('./helpers/transports/ftp');
var rets = require('./helpers/transports/rets');
var csv = require('./helpers/csv');
var log = require('debug')('honeybadger:worker');

var streamTransform = require('stream-transform');

var $Extractor = require('./extractor').Factory;

var worker = function(options) {
	this.runTask = function(task, callback) {

		/**
		 * Let's get all the configs we need
		 */

		log('Running task', task.name);

		var extractor_config = DataManager.extractors.filter(function(item){ if (item.id === task.extractor) return true; }).pop().value;
		log('Loaded task extractor', extractor_config.name);

		var source_config = DataManager.sources.filter(function(item){ if (item.id === extractor_config.source) return true; }).pop().value;
		log('Loaded task extraction source', source_config.name);

		var transformer_configs = DataManager.transformers.filter(function(item){ if (item.value.extractor === task.extractor) return true; }).map(function(item){ return item.value; });
		log('Discovered', transformer_configs.length, 'transformers');

		var loader_configs = [];
		transformer_configs.forEach(function(transform){
			log('Loaded task transformer', transform.name);
			DataManager.loaders.forEach(function(loader){
				if (loader.value.transform === transform._id) loader_configs.push(loader.value);
			})
		});

		log('Discovered', loader_configs.length, 'loaders');

		/**
		 * Let's get some instances of our etl objects
		 */
		var $e = $Extractor({
			id: extractor_config._id,
			name: extractor_config.name,
			source: source_config.source,
			target: extractor_config.target
		});

		$e.on('error',function(err, body){
			console.trace(err);
		});

		$e.on('data',function(){
			log('extractor got data');
		});

		return;





















        var mysql = require('mysql');
		loaders.forEach(function(loader){
			log('Loaded task loader', loader.name)
	        var dsn = utility.dsn(loader.target.dsn);
	        var connection = mysql.createConnection({
	            host: dsn.host,
	            user: dsn.user,
	            password: dsn.password,
	            database: dsn.database
	        });

	        var insert_query = 'INSERT INTO '+loader.target.schema.name+' SET ?';

	        // log(transformer);
	        //We want to pipe transformer events back to the client
	        db.get(loader.transform, function(err, transformer){

	            // _log('Checking transformer for extractor: '+ transformer.extractor);

	            // log(transformer);
	            //We want to pipe transformer events back to the client
	            db.get(transformer.extractor,function(err, extractor){
	                if (err) { /*_log('Error fetching extractor'); */return; }

	                // _log('Testing extraction from source: '+ extractor.source);

	                //We want to pipe extraction events back to the client
	                DataManager.getSource(extractor.source,function(err, body){
	                    if (err) {
	                        console.trace(err);
	                        // _log('<div class="text-danger">Extraction source is bad.</div>');
	                        return callback('onLoaderTest',err,null);
	                    }

	                    // _log('<div class="text-success">Extraction source is valid.</div>');
	                    var source = body;

	                    var testlimit = 100;
	                    // log(source.source);
	                    /**
	                     * We're going to leave in a bunch of extra steps here for the sake
	                     * of verbosity to the client. I had intended to simply this all down
	                     * to just instantiating an extractor and running a test, but I
	                     * decided that it was nice to have the extra info pumping to the UI.
	                     */
	                    if (source.source.type === 'FTP') {
	                        // _log('<div class="text-info">Extraction source is an FTP resource.</div>');

	                        ftp.validate(source.source, function(err,body){
	                            // (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">There was an error connecting to the FTP resource.</div>');
	                            if (err) return callback('onLoaderTest',err,null);

	                            // _log('<div class="text-info">Searching for extraction target.</div>');
	                            ftp.get(source.source, extractor.target.res, function(err,stream){
	                                // (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
	                                if (err) return callback('onLoaderTest',err,null);

	                                // _log('<div class="text-success">Discovered source file on remote file-system.</div>');

	                                stream.once('close', function(){ 
	                                    // _log('<div class="text-success">Completed reading source file from remote file-system.</div>');
	                                });

	                                var _delim = { csv: ',', tsv: "\t", pipe: '|' };
	                                var _quot = { default: '', dquote: '"', squote: "'" };

	                                var rawheaders = [];
	                                var headers = [];
	                                var trnheaders = [];
	                                var errors = false;


	                                var xformed = [];
	                                var records = [];
	                                var loaded = 0;
	                                var processed = 0;

	                                var xfm = streamTransform(function(record, cb){
	                                    // log('processed', processed++);
	                                    if (xformed.length >= testlimit) {
	                                        process.nextTick(function(){
	                                            // _log('<div class="text-success">Transform completed successfully.</div>');
	                                            // if (!errors) callback('onLoaderTest',null,{headers:headers, records:records});
	                                        });
	                                        return;
	                                    }

	                                    var rec = {};
	                                    var rstr = '{\n';
	                                    transformer.transform.normalize.forEach(function(item, index){
	                                        var i = rawheaders.indexOf(item.in);
	                                        if (headers.indexOf(item.out) === -1) headers[i] = item.out;
	                                        rec[item.out] = record[i];
	                                        rstr += '    "'+item.out+'" : "'+record[i]+'",\n';
	                                    });
	                                    rstr += '}'

	                                    connection.query(insert_query,rec,function(err,res){
	                                        if (!err) {
	                                            // log('\tloaded',loaded++);
	                                            records.push(true);
	                                            process.nextTick(function(){
	                                                // _log('<div class="text-success">Successfully created new record in target: '+dsn.database+'.'+loader.target.schema.name+'</div>');
	                                            });
	                                        } else {
	                                            errors = true;
	                                        }
	                                        if (records.length >= testlimit) {

	                                            process.nextTick(function(){
	                                                // _log('<div class="text-success">Load completed successfully.</div>');
	                                                if (!errors) callback('onLoaderTest',null,{headers:headers, records:records});
	                                                ftp.abort();
	                                                ftp.end();
	                                                ftp.destroy();
	                                            });
	                                            return;
	                                        }
	                                    });

	                                    xformed.push(true);
	                                    cb(null, record.join('|'));


	                                    // process.nextTick(function(){
	                                    //     _log('<pre>'+rstr+'</pre>');
	                                    // });

	                                }, {parallel: 1});

	                                csv.parse(_delim[ extractor.target.options.delimiter || 'csv' ], _quot[ extractor.target.options.delimiter || 'default' ], stream, function(err,res){
	                                    if (err === 'headers') {
	                                        // _log('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
	                                        process.nextTick(function(){
	                                            callback('onLoaderTest','Unable to parse column headers from data stream',null);
	                                        });
	                                        return;
	                                    } else if (err) {
	                                        log(err);
	                                        // _log('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
	                                        process.nextTick(function(){
	                                            callback('onLoaderTest','Unable to parse data stream',null);
	                                        });
	                                        return;
	                                    }

	                                    rawheaders = res.headers;

	                                    // _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
	                                    // _log('<pre>'+res.headers.join("\n")+'</pre>');

	                                }).pipe(xfm);

	                            });
	                        });
	                    } else if (source.source.type === 'RETS') {
	                        // _log('<div class="text-info">Extraction source is a RETS resource.</div>');

	                        rets.validate(source.source, function(err,client){
	                            // (!err)? _log('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>'):
	                                    // _log('<div class="text-danger">There was an error connecting to the RETS resource.</div>');
	                            if (err) return callback('onLoaderTest',err,null);

	                            // _log('<div class="text-info">Extracting 10 records via DMQL2 RETS Query.</div>');
	                            // _log('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
	                            // _log('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');
	                            // _log('<div class="text-info">-- Query: '+extractor.target.res+'</div>');
	                            var qry = {
	                                SearchType: extractor.target.type,
	                                Class: extractor.target.class,
	                                Query: extractor.target.res,
	                                Format: 'COMPACT-DECODED',
	                                Limit: testlimit
	                            };
	                            client.searchQuery(qry, function( error, data ) {

	                            	log('RETS data recv');

	                                if (error) {
	                                    // _log('<div class="text-danger">Query did not execute.</div>');
	                                    // _log('<pre class="text-danger">'+JSON.stringify(error,2)+'</pre>');
	                                    console.trace('RETS query error', error);
	                                    callback('onLoaderTest',error, null);
	                                    return;
	                                } else if (data.type == 'status') {
	                                    // _log('<div class="text-warning">'+data.text+'</div>');
	                                    if (!data.data || !data.data.length) //_log('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
	                                    callback('onLoaderTest',null,{data:data});
	                                    return;
	                                } else {
	                                    if (!data.data || !data.data.length) {}//_log('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
	                                    else if (data.data && data.data.length) {

	                                        // _log('<div class="text-success">RETS query found '+data.count+' records. We will sample a max of '+testlimit+'.</div>');

	                                        var rawheaders = [];
	                                        var headers = [];
	                                        var trnheaders = [];
	                                        var errors = false;
	        
	                                        var xformed = [];
	                                        var records = [];

	                                        var xfm = streamTransform(function(record, cb){
	                                            if (xformed.length >= testlimit) {
	                                                process.nextTick(function(){ 
	                                                    // _log('<div class="text-success">Transform completed successfully.</div>');
	                                                    if (!errors) callback('onLoaderTest',null,{headers:headers, records:records});
	                                                });
	                                                return;
	                                            }

	                                            var rec = {};
	                                            var rstr = '{\n';
	                                            transformer.transform.normalize.forEach(function(item, index){
	                                                var i = rawheaders.indexOf(item.in);
	                                                if (headers.indexOf(item.out) === -1) headers[i] = item.out;
	                                                // log(item,i,headers[i],record[i]);
	                                                rec[item.out] = record[i];
	                                                rstr += '    "'+item.out+'" : "'+record[i]+'",\n';
	                                            });
	                                            rstr += '}'

	                                            connection.query(insert_query,rec,function(err,res){
	                                                if (!err) {
	                                                    records.push(rec);
	                                                    log('Successfully created new record in target: '+dsn.database+'.'+loader.target.schema.name);
	                                                    // process.nextTick(function(){
	                                                        // _log('<div class="text-success">Successfully created new record in target: '+dsn.database+'.'+loader.target.schema.name+'</div>');
	                                                    // });
	                                                } else {
	                                                    errors = true;
	                                                }
	                                                if (records.length >= testlimit) {
	                                                    process.nextTick(function(){
	                                                        if (!errors) {
	                                                            // _log('<div class="text-success">Load completed successfully.</div>');
	                                                            callback('onLoaderTest',null,{headers:headers, records:records});
	                                                        } else {
	                                                            // _log('<div class="text-danger">Load failed.</div>');
	                                                            callback('onLoaderTest',{err:"Did not load all records"},{headers:headers, records:records});
	                                                        }
	                                                    });
	                                                    return;
	                                                }
	                                            });

	                                            xformed.push(true);
	                                            cb(null, record.join('|'));
	                                            
	                                            process.nextTick(function(){

	                                                // _log('<pre>'+rstr+'</pre>');
	                                            });

	                                        }, {parallel: 1});

	                                        csv.parse('\t', '', data, function(err,res){
	                                        	if (err) { console.trace(err); }
	                                            if (err === 'headers') {
	                                                // _log('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
	                                                process.nextTick(function(){
	                                                    callback('onLoaderTest','Unable to parse column headers from data stream',null);
	                                                });
	                                                return;
	                                            } else if (err) {
	                                                log(err);
	                                                // _log('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
	                                                process.nextTick(function(){
	                                                    callback('onLoaderTest','Unable to parse data stream',null);
	                                                });
	                                                return;
	                                            }

	                                            rawheaders = res.headers; 

	                                            // _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
	                                            // _log('<pre>'+res.headers.join("\n")+'</pre>');
	                                            // _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
	                                            
	                                        }).pipe(xfm);
	                                    }
	                                }
	                            });
	                        });
	                    }
	                });
	            });
	        });
		});






	};
}

module.exports = worker;