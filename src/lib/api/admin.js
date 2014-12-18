var ftp = require('../helpers/transports/ftp');
var rets = require('../helpers/transports/rets');
var csv = require('../helpers/csv');

var clog = function(target, client){
    return function(data){
        client.send('{ "event":"log-stream", "target": "'+target+'", "body":'+JSON.stringify(data)+'}');
    };
};

module.exports = {
    "source.list": function(callback){
        process.nextTick(function(){
            callback('onSourceList', null, DataManager.sources);
        });
    },
    "source.test": function(source, callback) {

        console.log(source.type+' Client Test');

        /**
         * Testing a source really just means validating access.
         * That may mean validating credentials, a URL or other
         * data endpoint.
         */
        switch(source.type)
        {
            case "FTP":
                ftp.validate(source, function(err,body){
                    (!err) ? callback('onvalidate',null,{success:true,body:body}) : callback('onvalidate',err, null);
                });
            break;
            case "RETS":
                rets.validate(source, function(err,body){
                    (!err) ? callback('onvalidate',null,{success:true,body:body}) : callback('onvalidate',err, null);
                });
            break;
        }
    },
    "source.save": function(source, callback) {
        DataManager.sourceSave(source, function(err, body){
            callback('onsave',err,body);
        });
    },
    "extractor.list": function(callback) {
        process.nextTick(function(){
            callback('onExtractorList', null, DataManager.extractors);
        });
    },
    "extractor.test": function(extractor, callback, client) {

        var _log = clog('extractor-log-body',client);
        _log('Testing extraction from source: '+ extractor.source);
        
        //We want to pipe extraction events back to the client
        DataManager.getSource(extractor.source,function(err, body){
            if (err) {
                console.trace(err);
                _log('<div class="text-danger">Extraction source is bad.</div>');
                return callback('onExtractorTest',err,null);
            }

            _log('<div class="text-success">Extraction source is valid.</div>');
            var source = body;
            // console.log(source.source);
            /**
             * We're going to leave in a bunch of extra steps here for the sake
             * of verbosity to the client. I had intended to simply this all down
             * to just instantiating an extractor and running a test, but I
             * decided that it was nice to have the extra info pumping to the UI.
             */
            if (source.source.type === 'FTP') {
                _log('<div class="text-info">Extraction source is an FTP resource.</div>');

                ftp.validate(source.source, function(err,body){
                    (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">There was an error connecting to the FTP resource.</div>');
                    if (err) return callback('onExtractorTest',err,null);

                    _log('<div class="text-info">Searching for extraction target.</div>');
                    ftp.get(source.source, extractor.target.res, function(err,stream){
                        (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
                        if (err) return callback('onExtractorTest',err,null);

                        _log('<div class="text-success">Discovered source file on remote file-system.</div>');

                        stream.once('close', function(){ 
                            _log('<div class="text-success">Completed reading source file from remote file-system.</div>');
                        });

                        /**
                         * We can only do CSV for the moment
                         */
                        if (extractor.target.format !== 'delimited-text') return;

                        var _delim = { csv: ',', tsv: "\t", pipe: '|' };
                        var _quot = { default: '', quotes: '"' };


                        csv.parse(_delim[ extractor.target.options.delimiter || csv ], _quot.default, stream, function(err,res){
                            if (err === 'headers') {
                                _log('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
                                process.nextTick(function(){
                                    callback('onExtractorTest','Unable to parse column headers from data stream',null);
                                });
                                return;
                            } else if (err) {
                                console.log(err);
                                _log('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                process.nextTick(function(){
                                    callback('onExtractorTest','Unable to parse data stream',null);
                                });
                                return;
                            }

                            _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                            _log('<pre>'+res.headers.join("\n")+'</pre>');
                            _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                            process.nextTick(function(){
                                callback('onExtractorTest',null,{headers:res.headers});
                            });
                        });
                    });
                });
            } else if (source.source.type === 'RETS') {
                _log('<div class="text-info">Extraction source is a RETS resource.</div>');

                rets.validate(source.source, function(err,client){
                    (!err)? _log('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>'):
                            _log('<div class="text-danger">There was an error connecting to the RETS resource.</div>');
                    if (err) return callback('onExtractorTest',err,null);

                    _log('<div class="text-info">Extracting 10 records via DMQL2 RETS Query.</div>');
                    _log('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
                    _log('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');
                    _log('<div class="text-info">-- Query: '+extractor.target.res+'</div>');
                    var qry = {
                        SearchType: extractor.target.type,
                        Class: extractor.target.class,
                        Query: extractor.target.res,
                        Format: 'COMPACT-DECODED',
                        Limit: 10
                    };
                    client.searchQuery(qry, function( error, data ) {

                        if (error) {
                            _log('<div class="text-danger">Query did not execute.</div>');
                            _log('<pre class="text-danger">'+JSON.stringify(error,2)+'</pre>');
                            console.log(error);
                            callback('onExtractorTest',error, null);
                            return;
                        } else if (data.type == 'status') {
                            _log('<div class="text-warning">'+data.text+'</div>');
                            if (!data.data || !data.data.length) _log('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                            callback('onExtractorTest',null,{data:data});
                            return;
                        } else {
                            if (!data.data || !data.data.length) _log('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                            else if (data.data && data.data.length) {

                                _log('<div class="text-success">RETS query received '+data.data.length+' records back.</div>');

                                csv.parse('\t', '', data, function(err,res){
                                    if (err === 'headers') {
                                        _log('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
                                        process.nextTick(function(){
                                            callback('onExtractorTest','Unable to parse column headers from data stream',null);
                                        });
                                        return;
                                    } else if (err) {
                                        console.log(err);
                                        _log('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                        process.nextTick(function(){
                                            callback('onExtractorTest','Unable to parse data stream',null);
                                        });
                                        return;
                                    }

                                    _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                    _log('<pre>'+res.headers.join("\n")+'</pre>');
                                    _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                    process.nextTick(function(){
                                        callback('onExtractorTest',null,{headers:res.headers});
                                    });
                                });

                            }
                        }
                    });

                });
            }
        });
    },
    "extractor.save": function(extractor, callback) {
        DataManager.extractorSave(extractor, function(err, body){
            callback('onExtractorSave',err,body);
        });
    },
    "transformer.list": function(callback){
        process.nextTick(function(){
            callback('onTransformerList', null, DataManager.transformers);
        });
    },
    "transformer.test": function(transformer, callback, client) {

        var _log = clog('transformer-log-body',client);
        _log('Testing transformer from extractor: '+ transformer.extractor);

        // console.log(transformer);
        //We want to pipe transformer events back to the client
        db.get(transformer.extractor,function(err, extractor){
            if (err) { _log('Error fetching extractor'); return; }

            _log('Testing extraction from source: '+ extractor.source);

            //We want to pipe extraction events back to the client
            DataManager.getSource(extractor.source,function(err, body){
                if (err) {
                    console.trace(err);
                    _log('<div class="text-danger">Extraction source is bad.</div>');
                    return callback('onTransformerTest',err,null);
                }

                _log('<div class="text-success">Extraction source is valid.</div>');
                var source = body;
                // console.log(source.source);
                /**
                 * We're going to leave in a bunch of extra steps here for the sake
                 * of verbosity to the client. I had intended to simply this all down
                 * to just instantiating an extractor and running a test, but I
                 * decided that it was nice to have the extra info pumping to the UI.
                 */
                if (source.source.type === 'FTP') {
                    _log('<div class="text-info">Extraction source is an FTP resource.</div>');

                    ftp.validate(source.source, function(err,body){
                        (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">There was an error connecting to the FTP resource.</div>');
                        if (err) return callback('onTransformerTest',err,null);

                        _log('<div class="text-info">Searching for extraction target.</div>');
                        ftp.get(source.source, extractor.target.res, function(err,stream){
                            (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
                            if (err) return callback('onTransformerTest',err,null);

                            _log('<div class="text-success">Discovered source file on remote file-system.</div>');

                            stream.once('close', function(){ 
                                _log('<div class="text-success">Completed reading source file from remote file-system.</div>');
                            });

                            var _delim = { csv: ',', tsv: "\t", pipe: '|' };
                            var _quot = { default: '', dquote: '"', squote: "'" };

                            var rawheaders = [];
                            var headers = [];
                            var records = [];
                            var trnheaders = [];
                            var errors = false;

                            var xfm = streamTransform(function(record, cb){
                                if (records.length >= 10) {
                                    process.nextTick(function(){
                                        _log('<div class="text-success">Transform completed successfully.</div>');
                                        if (!errors) callback('onTransformerTest',null,{headers:headers, records:records});
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

                                records.push(rec);
                                _log('<pre>'+rstr+'</pre>');

                                cb(null, record.join('|'));
                            }, {parallel: 1});

                            csv.parse(_delim[ extractor.target.options.delimiter || 'csv' ], _quot[ extractor.target.options.delimiter || 'default' ], stream, function(err,res){
                                if (err === 'headers') {
                                    _log('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
                                    process.nextTick(function(){
                                        callback('onTransformerTest','Unable to parse column headers from data stream',null);
                                    });
                                    return;
                                } else if (err) {
                                    console.log(err);
                                    _log('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                    process.nextTick(function(){
                                        callback('onTransformerTest','Unable to parse data stream',null);
                                    });
                                    return;
                                }

                                rawheaders = res.headers;

                                _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                _log('<pre>'+res.headers.join("\n")+'</pre>');
                                _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');

                            }).pipe(xfm);

                        });
                    });
                } else if (source.source.type === 'RETS') {
                    _log('<div class="text-info">Extraction source is a RETS resource.</div>');

                    rets.validate(source.source, function(err,client){
                        (!err)? _log('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>'):
                                _log('<div class="text-danger">There was an error connecting to the RETS resource.</div>');
                        if (err) return callback('onTransformerTest',err,null);

                        _log('<div class="text-info">Extracting 10 records via DMQL2 RETS Query.</div>');
                        _log('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
                        _log('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');
                        _log('<div class="text-info">-- Query: '+extractor.target.res+'</div>');
                        var qry = {
                            SearchType: extractor.target.type,
                            Class: extractor.target.class,
                            Query: extractor.target.res,
                            Format: 'COMPACT-DECODED',
                            Limit: 10
                        };
                        client.searchQuery(qry, function( error, data ) {

                            if (error) {
                                _log('<div class="text-danger">Query did not execute.</div>');
                                _log('<pre class="text-danger">'+JSON.stringify(error,2)+'</pre>');
                                console.log(error);
                                callback('onTransformerTest',error, null);
                                return;
                            } else if (data.type == 'status') {
                                _log('<div class="text-warning">'+data.text+'</div>');
                                if (!data.data || !data.data.length) _log('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                callback('onTransformerTest',null,{data:data});
                                return;
                            } else {
                                if (!data.data || !data.data.length) _log('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                else if (data.data && data.data.length) {

                                    _log('<div class="text-success">RETS query received '+data.data.length+' records back.</div>');

                                    var rawheaders = [];
                                    var headers = [];
                                    var records = [];
                                    var trnheaders = [];
                                    var errors = false;

                                    var xfm = streamTransform(function(record, cb){
                                        if (records.length >= data.data.length) {
                                            process.nextTick(function(){
                                                _log('<div class="text-success">Transform completed successfully.</div>');
                                                if (!errors) callback('onTransformerTest',null,{headers:headers, records:records});
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

                                        records.push(rec);
                                        _log('<pre>'+rstr+'</pre>');

                                        cb(null, record.join('|'));
                                    }, {parallel: 1});

                                    csv.parse('\t', '"', data, function(err,res){
                                        if (err === 'headers') {
                                            _log('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
                                            process.nextTick(function(){
                                                callback('onTransformerTest','Unable to parse column headers from data stream',null);
                                            });
                                            return;
                                        } else if (err) {
                                            console.log(err);
                                            _log('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                            process.nextTick(function(){
                                                callback('onTransformerTest','Unable to parse data stream',null);
                                            });
                                            return;
                                        }

                                        rawheaders = res.headers; 

                                        _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                        _log('<pre>'+res.headers.join("\n")+'</pre>');
                                        _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                        
                                    }).pipe(xfm);

                                }
                            }
                        });

                    });
                }
            });


        });
    },
    "transformer.save": function(transformer, callback) {
        DataManager.transformerSave(transformer, function(err, body){
            callback('onTransformerSave',err,body);
        });
    },
    "loader.list": function(callback) {
        process.nextTick(function(){
            callback('onLoaderList', null, DataManager.loaders);
        });
    },
    "loader.test": function(loader, callback, client) {

        var _log = clog('loader-log-body',client);
        _log('Testing loader from transformer: '+ loader.transform);

        var mysql = require('mysql');

        var dsn = utility.dsn(loader.target.dsn);
        var connection = mysql.createConnection({
            host: dsn.host,
            user: dsn.user,
            password: dsn.password,
            database: dsn.database
        });

        var insert_query = 'INSERT INTO '+loader.target.schema.name+' SET ?';

        // console.log(transformer);
        //We want to pipe transformer events back to the client
        db.get(loader.transform, function(err, transformer){

            _log('Checking transformer for extractor: '+ transformer.extractor);

            // console.log(transformer);
            //We want to pipe transformer events back to the client
            db.get(transformer.extractor,function(err, extractor){
                if (err) { _log('Error fetching extractor'); return; }

                _log('Testing extraction from source: '+ extractor.source);

                //We want to pipe extraction events back to the client
                DataManager.getSource(extractor.source,function(err, body){
                    if (err) {
                        console.trace(err);
                        _log('<div class="text-danger">Extraction source is bad.</div>');
                        return callback('onLoaderTest',err,null);
                    }

                    _log('<div class="text-success">Extraction source is valid.</div>');
                    var source = body;

                    var testlimit = 5;
                    // console.log(source.source);
                    /**
                     * We're going to leave in a bunch of extra steps here for the sake
                     * of verbosity to the client. I had intended to simply this all down
                     * to just instantiating an extractor and running a test, but I
                     * decided that it was nice to have the extra info pumping to the UI.
                     */
                    if (source.source.type === 'FTP') {
                        _log('<div class="text-info">Extraction source is an FTP resource.</div>');

                        ftp.validate(source.source, function(err,body){
                            (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">There was an error connecting to the FTP resource.</div>');
                            if (err) return callback('onLoaderTest',err,null);

                            _log('<div class="text-info">Searching for extraction target.</div>');
                            ftp.get(source.source, extractor.target.res, function(err,stream){
                                (!err) ? _log('<div class="text-success">Connection established.</div>') : _log('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
                                if (err) return callback('onLoaderTest',err,null);

                                _log('<div class="text-success">Discovered source file on remote file-system.</div>');

                                stream.once('close', function(){ 
                                    _log('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                });

                                var _delim = { csv: ',', tsv: "\t", pipe: '|' };
                                var _quot = { default: '', dquote: '"', squote: "'" };

                                var rawheaders = [];
                                var headers = [];
                                var trnheaders = [];
                                var errors = false;


                                var xformed = [];
                                var records = [];

                                var xfm = streamTransform(function(record, cb){
                                    if (xformed.length >= testlimit) {
                                        process.nextTick(function(){
                                            _log('<div class="text-success">Transform completed successfully.</div>');
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
                                        console.log(err);
                                        if (!err) {
                                            records.push(rec);
                                            process.nextTick(function(){
                                                _log('<div class="text-success">Successfully created new record in target: '+dsn.database+'.'+loader.target.schema.name+'</div>');
                                            });
                                        } else {
                                            errors = true;
                                        }
                                        if (records.length >= testlimit) {
                                            process.nextTick(function(){
                                                _log('<div class="text-success">Load completed successfully.</div>');
                                                if (!errors) callback('onLoaderTest',null,{headers:headers, records:records});
                                            });
                                            return;
                                        }
                                    });

                                    xformed.push(true);
                                    cb(null, record.join('|'));


                                    process.nextTick(function(){
                                        _log('<pre>'+rstr+'</pre>');
                                    });

                                }, {parallel: 1});

                                csv.parse(_delim[ extractor.target.options.delimiter || 'csv' ], _quot[ extractor.target.options.delimiter || 'default' ], stream, function(err,res){
                                    if (err === 'headers') {
                                        _log('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
                                        process.nextTick(function(){
                                            callback('onLoaderTest','Unable to parse column headers from data stream',null);
                                        });
                                        return;
                                    } else if (err) {
                                        console.log(err);
                                        _log('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                        process.nextTick(function(){
                                            callback('onLoaderTest','Unable to parse data stream',null);
                                        });
                                        return;
                                    }

                                    rawheaders = res.headers;

                                    _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                    _log('<pre>'+res.headers.join("\n")+'</pre>');
                                    _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');

                                }).pipe(xfm);

                            });
                        });
                    } else if (source.source.type === 'RETS') {
                        _log('<div class="text-info">Extraction source is a RETS resource.</div>');

                        rets.validate(source.source, function(err,client){
                            (!err)? _log('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>'):
                                    _log('<div class="text-danger">There was an error connecting to the RETS resource.</div>');
                            if (err) return callback('onLoaderTest',err,null);

                            _log('<div class="text-info">Extracting 10 records via DMQL2 RETS Query.</div>');
                            _log('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
                            _log('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');
                            _log('<div class="text-info">-- Query: '+extractor.target.res+'</div>');
                            var qry = {
                                SearchType: extractor.target.type,
                                Class: extractor.target.class,
                                Query: extractor.target.res,
                                Format: 'COMPACT-DECODED',
                                Limit: testlimit
                            };
                            client.searchQuery(qry, function( error, data ) {

                                if (error) {
                                    _log('<div class="text-danger">Query did not execute.</div>');
                                    _log('<pre class="text-danger">'+JSON.stringify(error,2)+'</pre>');
                                    console.log(error);
                                    callback('onLoaderTest',error, null);
                                    return;
                                } else if (data.type == 'status') {
                                    _log('<div class="text-warning">'+data.text+'</div>');
                                    if (!data.data || !data.data.length) _log('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                    callback('onLoaderTest',null,{data:data});
                                    return;
                                } else {
                                    if (!data.data || !data.data.length) _log('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                    else if (data.data && data.data.length) {

                                        _log('<div class="text-success">RETS query found '+data.count+' records. We will sample a max of '+testlimit+'.</div>');

                                        var rawheaders = [];
                                        var headers = [];
                                        var trnheaders = [];
                                        var errors = false;
        
                                        var xformed = [];
                                        var records = [];

                                        var xfm = streamTransform(function(record, cb){
                                            if (xformed.length >= testlimit) {
                                                process.nextTick(function(){ 
                                                    _log('<div class="text-success">Transform completed successfully.</div>');
                                                    // if (!errors) callback('onLoaderTest',null,{headers:headers, records:records});
                                                });
                                                return;
                                            }

                                            var rec = {};
                                            var rstr = '{\n';
                                            transformer.transform.normalize.forEach(function(item, index){
                                                var i = rawheaders.indexOf(item.in);
                                                if (headers.indexOf(item.out) === -1) headers[i] = item.out;
                                                // console.log(item,i,headers[i],record[i]);
                                                rec[item.out] = record[i];
                                                rstr += '    "'+item.out+'" : "'+record[i]+'",\n';
                                            });
                                            rstr += '}'

                                            connection.query(insert_query,rec,function(err,res){
                                                if (!err) {
                                                    records.push(rec);
                                                    process.nextTick(function(){
                                                        _log('<div class="text-success">Successfully created new record in target: '+dsn.database+'.'+loader.target.schema.name+'</div>');
                                                    });
                                                } else {
                                                    errors = true;
                                                }
                                                if (records.length >= testlimit) {
                                                    process.nextTick(function(){
                                                        if (!errors) {
                                                            _log('<div class="text-success">Load completed successfully.</div>');
                                                            callback('onLoaderTest',null,{headers:headers, records:records});
                                                        } else {
                                                            _log('<div class="text-danger">Load failed.</div>');
                                                            callback('onLoaderTest',{err:"Did not load all records"},{headers:headers, records:records});
                                                        }
                                                    });
                                                    return;
                                                }
                                            });

                                            xformed.push(true);
                                            cb(null, record.join('|'));
                                            
                                            process.nextTick(function(){

                                                _log('<pre>'+rstr+'</pre>');
                                            });

                                        }, {parallel: 1});

                                        csv.parse('\t', '"', data, function(err,res){
                                            if (err === 'headers') {
                                                _log('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
                                                process.nextTick(function(){
                                                    callback('onLoaderTest','Unable to parse column headers from data stream',null);
                                                });
                                                return;
                                            } else if (err) {
                                                console.log(err);
                                                _log('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                                process.nextTick(function(){
                                                    callback('onLoaderTest','Unable to parse data stream',null);
                                                });
                                                return;
                                            }

                                            rawheaders = res.headers; 

                                            _log('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                            _log('<pre>'+res.headers.join("\n")+'</pre>');
                                            _log('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                            
                                        }).pipe(xfm);
                                    }
                                }
                            });
                        });
                    }
                });
            });
        });
    },
    "loader.save": function(loader, callback) {
        DataManager.loaderSave(loader, function(err, body){
            callback('onLoaderSave',err,body);
        });
    },
    "loader.validate": function(loader, callback) {
        switch(loader.target.type)
        {
            case "mysql":
                var mysql = require('mysql');

                var dsn = utility.dsn(loader.target.dsn);
                var schema = loader.target.schema;

                var connection = mysql.createConnection({
                    host: dsn.host,
                    user: dsn.user,
                    password: dsn.password,
                    database: dsn.database
                });

                connection.query('DESCRIBE '+schema.name, function(err, res){
                    if (err) {
                        console.trace(err);
                        callback('onLoaderValidate',err,null);
                        return;
                    }

                    var fields = schema.fields.map(function(i){
                        return i.key;
                    });

                    var matches = res.filter(function(i){
                        return (fields.indexOf(i.Field) > -1) ? true : false;
                    });
                    
                    if (fields.length === matches.length) callback('onLoaderValidate',null,{schema:res,fields:fields,matches:matches});
                    else callback('onLoaderValidate',{ err: "The fields for this loader don't match the schema on the target"},{schema:res,fields:fields,matches:matches});
                });
            break;
            case "couchdb":
            break;
            case "ftp":
            break;
        }
    },
    "loader.validateConnection": function(loader, callback) {
        switch(loader.target.type)
        {
            case "mysql":
                var mysql = require('mysql');

                var dsn = utility.dsn(loader.target.dsn);
                var connection = mysql.createConnection({
                    host: dsn.host,
                    user: dsn.user,
                    password: dsn.password,
                    database: dsn.database
                });
                connection.query('SHOW tables', function(err, res){
                    if (err) {
                        console.trace(err);
                        callback('onLoaderValidateConnection',err,null);
                        return;
                    }
                    callback('onLoaderValidateConnection',null,{tables:res});
                });
            break;
            case "couchdb":
            break;
            case "ftp":
            break;
        }
    },
    "loader.createSchema": function(loader, callback) {
        switch(loader.target.type)
        {
            case "mysql":
                var mysql = require('mysql');

                var dsn = utility.dsn(loader.target.dsn);
                var connection = mysql.createConnection({
                    host: dsn.host,
                    user: dsn.user,
                    password: dsn.password,
                    database: dsn.database
                });

                var qry = 'CREATE TABLE `'+loader.target.schema.name+'` ( `id` INT NOT NULL AUTO_INCREMENT, ';
                loader.target.schema.fields.forEach(function(item, index){
                    qry += '`'+item.key+'` ';
                    switch(item.type) {
                        case "string":
                            qry += 'VARCHAR(255) NULL,'
                        break;
                        case "boolean":
                            qry += 'INT NULL,'
                        break;
                        case "float":
                            qry += 'FLOAT NULL,'
                        break;
                        case "date":
                            qry += 'DATE NULL,'
                        break;
                        case "text":
                            qry += 'TEXT NULL,'
                        break;
                    }
                })
                qry += 'PRIMARY KEY (`id`), UNIQUE INDEX `id_UNIQUE` (`id` ASC));'
                connection.query(qry, function(err, res){
                    if (err) {
                        console.trace(err);
                        callback('onLoaderSchemaCreate',err,null);
                        return;
                    }
                    callback('onLoaderSchemaCreate',null,{res:res});
                });
            break;
            case "couchdb":
            break;
            case "ftp":
            break;
        }
    },
    "ftp.browse": function(source, callback) {
        DataManager.getSource(source.id, function(error, body){
            if (!error && body.source.type === 'FTP') {
                ftp.browse(body.source, function(err, list){
                    if (err) return callback('onFTPBrowse',err,null);
                    return callback('onFTPBrowse',null,{success:true, list: list});
                });
            }
        });
    },
    "rets.getClassifications": function(source, callback) {
        DataManager.getSource(source.id,function(err,src){
            rets.getClassifications(source.source, function(err, data){
                if (!err) callback('onRETSBrowse',null,{success:true, meta:data});
                else callback('onRETSBrowse',err,null);
            });
        });
    },
    "rets.getMetadataResources": function(source, callback) {
        DataManager.getSource(source.id,function(err,src){
            rets.getMetadataResources(source.source, function(err, data){
                if (!err) callback('onRETSExplore',null,{success:true, meta:data});
                else callback('onRETSExplore',err,null);
            });
        });
    },
    "rets.getMetadataTable": function(source, callback, client) {
        DataManager.getSource(source.id,function(err,src){
            rets.getMetadataTable(source.source, function(err, data){
                if (!err) callback('onRETSInspect',null,{success:true, meta:data});
                else callback('onRETSInspect',err,null);
            });
        });
    },
    "rets.query": function(_type, _class, _query, _limit, callback, client) {
        // Fetch classifications
        client.searchQuery({
            SearchType: _type || 'Property',
            Class: _class || 'A',
            Query: _query || '(status=Listed)',
            Limit: _limit || 10
        }, function( error, data ) {
            console.log( require( 'util' ).inspect( data, { showHidden: false, colors: true, depth: 5 } ) )
        });
    }

};