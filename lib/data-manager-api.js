// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
// TODO: This API backend is dedicated just to the Data Manager console
module.exports = {
    list: function(callback){
        process.nextTick(function(){
            callback('onList', null, DataManager.sources);
        });
    },
    getExtractorList: function(callback){
        process.nextTick(function(){
            callback('onExtractorList', null, DataManager.extractors);
        });
    },
    getTransformerList: function(callback){
        process.nextTick(function(){
            callback('onTransformerList', null, DataManager.transformers);
        });
    },
    getLoaderList: function(callback){
        process.nextTick(function(){
            callback('onLoaderList', null, DataManager.loaders);
        });
    },
    browseFTP: function(source, callback){
        DataManager.getSource(source.id, function(error, body){
            if (!error && body.source.type === 'FTP') {
                var ftp = require('./ftp-extractor');
                ftp.browse(body.source, function(err, list){
                    if (err) return callback('onFTPBrowse',err,null);
                    return callback('onFTPBrowse',null,{success:true, list: list});
                });
            }
        });
    },
    browseRETS: function(source, callback, client){
        DataManager.getSource(source.id,function(err,src){
            var librets = require('rets-client');

            var uri = url.parse(source.source.uri);

            var client = librets.createConnection({
                host: uri.hostname,
                port: uri.port,
                path: uri.path,
                protocol: uri.protocol,
                user: source.source.auth.username,
                pass: source.source.auth.password,
                version: source.source.version || '1.7.2',
                agent: { user: source.source.auth.userAgentHeader, password: source.source.auth.userAgentPassword }
            });

            client.once('connection.success',function(client){
                console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                client.getClassifications( source.source.rets.resource, function has_meta( error, meta ) {
                    if( error ) {
                        console.log( 'Error while fetching classifications: %s.', error.message );
                        callback('onRETSBrowse',error, null);
                    } else {
                        // console.log( 'Fetched %d classifications.', Object.keys( meta.data ).length );
                        // console.log( 'Classification keys: %s.', Object.keys( meta.data ) );
                        callback('onRETSBrowse',null,{success:true, meta:meta});
                    }
                });
            });

            client.once('connection.error',function(error, client){
                console.error( 'Connection failed: %s.', error.message );
                callback('onRETSBrowse',error, null);
            });
        });
    },
    exploreRETS: function(source, callback, client){
        DataManager.getSource(source.id,function(err,src){
            var librets = require('rets-client');

            var uri = url.parse(source.source.uri);

            var client = librets.createConnection({
                host: uri.hostname,
                port: uri.port,
                protocol: uri.protocol,
                path: uri.path,
                user: source.source.auth.username,
                pass: source.source.auth.password,
                version: source.source.version || '1.7.2',
                agent: { user: source.source.auth.userAgentHeader, password: source.source.auth.userAgentPassword }
            });

            client.once('connection.success',function(client){
                console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                client.getMetadataResources('0', function( error, data ) {
                    // console.log( require( 'util' ).inspect( error, { showHidden: false, colors: true, depth: 5 } ) )
                    // console.log( require( 'util' ).inspect( data, { showHidden: false, colors: true, depth: 5 } ) )
                    callback('onRETSExplore',null,{success:true, meta:data});
                });
            });

            client.once('connection.error',function(error, client){
                console.error( 'Connection failed: %s.', error.message );
                callback('onRETSExplore',error, null);
            });
        });
    },
    inspectRETS: function(source, callback, client){
        DataManager.getSource(source.id,function(err,src){
            var librets = require('rets-client');

            var uri = url.parse(source.source.uri);

            var client = librets.createConnection({
                host: uri.hostname,
                port: uri.port,
                protocol: uri.protocol,
                path: uri.path,
                user: source.source.auth.username,
                pass: source.source.auth.password,
                version: source.source.version || '1.7.2',
                agent: { user: source.source.auth.userAgentHeader, password: source.source.auth.userAgentPassword }
            });

            client.once('connection.success',function(client){
                console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                client.getMetadataTable(source.source.rets.resource, source.source.rets.classification, function( error, data ) {
                    // console.log( require( 'util' ).inspect( error, { showHidden: false, colors: true, depth: 5 } ) )
                    // console.log( require( 'util' ).inspect( data, { showHidden: false, colors: true, depth: 5 } ) )
                    callback('onRETSInspect',null,{success:true, meta:data});
                });
            });

            client.once('connection.error',function(error, client){
                console.error( 'Connection failed: %s.', error.message );
                callback('onRETSInspect',error, null);
            });
        });
    },
    extractRETS: function() {
        // Fetch classifications
        // client.searchQuery({
        //     SearchType: 'Property',
        //     Class: 'A',
        //     Query: '(status=Listed)',
        //     Limit: 10
        // }, function( error, data ) {
        //     console.log( require( 'util' ).inspect( data, { showHidden: false, colors: true, depth: 5 } ) )
        // });
    },
    testExtractor: function(extractor, callback, client){

        var clog = function(e){
            client.send('{ "event":"log-stream", "target": "extraction-log-body", "body":'+JSON.stringify(e)+'}');
        };

        //We want to pipe extraction events back to the client
        clog('Testing extraction from source: '+ extractor.source);
        DataManager.getSource(extractor.source,function(err, body){
            if (!err) {
                clog('<div class="text-success">Extraction source is valid.</div>');
                var src = body;
                if (src.source.type === 'FTP') {

                    clog('<div class="text-info">Extraction source is an FTP resource.</div>');
                    var client = require('ftp');
                    var c = new client();

                    c.on('ready', function() {
                        clog('<div class="text-success">Connection established.</div>');
                        clog('<div class="text-info">Searching for extraction target.</div>');

                        c.get(extractor.target.res, function(err, stream){
                            if (err) {
                                clog('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
                                clog(err);
                                console.log(err);
                                process.nextTick(function(){
                                    callback('onExtractorTest',err,null);
                                });
                                return;
                            }

                            clog('<div class="text-success">Discovered source file on remote file-system.</div>');
                            stream.once('close', function(){ 
                                clog('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                c.end(); 
                            });

                            var parseCSV = function(delimiter,quotes,escape){
                                var errors = false;
                                clog('<div class="text-info">Streaming to CSV extraction engine.</div>');
                                var libcsv = require('csv-parse');
                                var headers = null;
                                clog('<div class="text-info">Using CSV delimiter: '+delimiter+'</div>');
                                clog('<div class="text-info">Using quote character: '+quotes+'</div>');
                                clog('<div class="text-info">Using escape character: "</div>');
                                var parser = libcsv({delimiter:delimiter, quote: quotes, columns: function(head){
                                    if (head.length <= 1) {
                                        errors = true;
                                        clog('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
                                        process.nextTick(function(){
                                            callback('onExtractorTest','Unable to parse column headers from data stream',null);
                                        });
                                    } else {
                                        headers = head;
                                        clog('<div class="text-success">CSV extraction engine was found the following column headers.</div>');
                                        clog('<pre>'+head.join("\n")+'</pre>');
                                    }
                                }});

                                parser.on('finish',function(){
                                    clog('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                    process.nextTick(function(){
                                        if (!errors) callback('onExtractorTest',null,{headers:headers});
                                    })
                                });

                                parser.on('error',function(err){
                                    console.log(err);
                                    clog('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                    process.nextTick(function(){
                                        callback('onExtractorTest','Unable to parse data stream',null);
                                    })
                                });

                                stream.pipe(parser);
                            };

                            console.log(extractor.target)

                            switch(extractor.target.format)
                            {
                                case "csv":
                                    parseCSV(',','');
                                break;
                                case "tsv":
                                    parseCSV("\t",'');
                                break;
                                case "pipe":
                                    parseCSV('|','');
                                break;
                                default:
                                    clog('<div class="text-danger">Invalid target format.</div>');
                                    process.nextTick(function(){
                                        callback('onExtractorTest','Invalid target format',null);
                                    });                                    
                            }

                        });

                    });

                    c.on('error', function(e) {
                        clog('<div class="text-danger">There was an error connecting to the FTP resource.</div>');
                        clog(e);
                        process.nextTick(function(){
                            callback('onExtractorTest',e,null);
                        });
                    });

                    c.connect({
                        host: src.source.uri,
                        port: src.source.port,
                        user: src.source.auth.username,
                        password: src.source.auth.password
                    });
                } else if (src.source.type === 'RETS') {
                    clog('<div class="text-info">Extraction source is a RETS resource.</div>');
                    var librets = require('rets-client');

                    var uri = url.parse(src.source.uri);

                    var client = librets.createConnection({
                        host: uri.hostname,
                        port: uri.port,
                        protocol: uri.protocol,
                        path: uri.path,
                        user: src.source.auth.username,
                        pass: src.source.auth.password,
                        version: src.source.version || '1.7.2',
                        agent: { user: src.source.auth.userAgentHeader, password: src.source.auth.userAgentPassword }
                    });

                    client.once('connection.success',function(client){
                        console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                        clog('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>');
                        clog('<div class="text-info">Extracting 10 records via DMQL2 RETS Query.</div>');
                        clog('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
                        clog('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');
                        clog('<div class="text-info">-- Query: '+extractor.target.res+'</div>');
                        var qry = {
                            SearchType: extractor.target.type,
                            Class: extractor.target.class,
                            Query: extractor.target.res,
                            Format: 'COMPACT-DECODED',
                            Limit: 1
                        };
                        client.searchQuery(qry, function( error, data ) {

                            if (error) {
                                clog('<div class="text-danger">Query did not execute.</div>');
                                clog('<pre class="text-danger">'+JSON.stringify(error,2)+'</pre>');
                                console.log(error);
                                callback('onExtractorTest',error, null);
                                return;
                            } else if (data.type == 'status') {
                                clog('<div class="text-warning">'+data.text+'</div>');
                                if (!data.data || !data.data.length) clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                callback('onExtractorTest',null,{data:data});
                                return;
                            } else {
                                if (!data.data || !data.data.length) clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                else if (data.data && data.data.length) {
                                    var libcsv = require('csv-parse');
                                    var headers = null;
                                    var errors = false;
                                    var parser = libcsv({delimiter:'\t', quote: '', columns: function(head){
                                        if (head.length <= 1) {
                                            errors = true;
                                            clog('<div class="text-danger">CSV extraction engine was unable to find column headers; perhaps you are using the wrong delimiter.</div>');
                                            process.nextTick(function(){
                                                callback('onExtractorTest','Unable to parse column headers from data stream',null);
                                            });
                                        } else {
                                            headers = head;
                                            clog('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                            clog('<pre>'+head.join("\n")+'</pre>');
                                        }
                                    }});

                                    parser.on('finish',function(){
                                        clog('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                        process.nextTick(function(){
                                            clog('<div class="text-success">Successfully extracted and parsed '+data.data.length+' records.</div>');
                                            if (!errors) callback('onExtractorTest',null,{headers:headers, data:data});
                                        })
                                    });

                                    parser.on('error',function(err){
                                        console.log(err);
                                        clog('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                        process.nextTick(function(){
                                            callback('onExtractorTest','Unable to parse data stream',null);
                                        })
                                    });

                                    parser.write(data.data);
                                    parser.end();
                                }
                            }
                        });
                    });

                    client.once('connection.error',function(error, client){
                        console.error( 'Connection failed: %s.', error.message );
                        callback('onExtractorTest',error, null);
                    });
                }
            }
            else {
                clog('<div class="text-danger">Extraction source is bad.</div>');
                callback('onExtractorTest',err,null);
            }
        });

    },
    saveExtractor: function(extractor, callback) {
        DataManager.extractorSave(extractor, function(err, body){
            callback('onExtractorSave',err,body);
        });
    },
    testTransformer: function(transformer, callback, client) {

        var clog = function(e){
            client.send('{ "event":"log-stream", "target": "transformer-log-body", "body":'+JSON.stringify(e)+'}');
        };

        // console.log(transformer);
        //We want to pipe transformer events back to the client
        db.get(transformer.extractor,function(err, extractor){
            if (!err) {

                clog('Testing transformer from extractor: '+ extractor.name);
                clog('Testing extractor from source: '+ extractor.source);
                DataManager.getSource(extractor.source,function(err, body){
                    if (!err) {
                        clog('<div class="text-success">Extraction source is valid.</div>');
                        var src = body;
                        if (src.source.type === 'FTP') {

                            clog('<div class="text-info">Extraction source is an FTP resource.</div>');
                            var client = require('ftp');
                            var c = new client();

                            c.on('ready', function() {
                                clog('<div class="text-success">Connection established.</div>');
                                clog('<div class="text-info">Searching for extraction target.</div>');

                                c.get(extractor.target.res, function(err, stream){
                                    if (err) {
                                        clog('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
                                        clog(err);
                                        console.log(err);
                                        process.nextTick(function(){
                                            callback('onTransformerTest',err,null);
                                        });
                                        return;
                                    }

                                    clog('<div class="text-success">Discovered source file on remote file-system.</div>');
                                    stream.once('close', function(){ 
                                        clog('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                        c.end(); 
                                    });

                                    var parseCSV = function(delimiter,quotes,escape){
                                        var libcsv = require('csv-parse');
                                        var errors = false;

                                        var rawheaders = [];
                                        var headers = [];
                                        var records = [];
                                        var trnheaders = [];

                                        transformer.transform.normalize.forEach(function(item, index){
                                            trnheaders.push(item.in);
                                        });

                                        clog('<div class="text-info">Streaming to CSV extraction engine.</div>');
                                        clog('<div class="text-info">Using CSV delimiter: '+delimiter+'</div>');
                                        clog('<div class="text-info">Using quote character: '+quotes+'</div>');
                                        clog('<div class="text-info">Using escape character: "</div>');

                                        var parser = libcsv({delimiter:delimiter, quote: quotes, columns: function(head){
                                            clog('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                            clog('<pre>'+head.join("\n")+'</pre>');
                                            clog('<div class="text-info">Transformer wants the following columns.</div>');
                                            clog('<pre>'+trnheaders.join("\n")+'</pre>');
                                            clog('<div class="text-info">Transformer sampling 10 records...</div>');

                                            rawheaders = head;
                                        }});

                                        parser.on('finish',function(){
                                            clog('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                        });

                                        parser.on('error',function(err){
                                            console.log(err);
                                            clog('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                            process.nextTick(function(){
                                                callback('onTransformerTest','Unable to parse data stream',null);
                                            })
                                        });

                                        var xfm = streamTransform(function(record, cb){
                                            if (records.length >= 10) {
                                                process.nextTick(function(){
                                                    clog('<div class="text-success">Transform completed successfully.</div>');
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
                                            clog('<pre>'+rstr+'</pre>');

                                            cb(null, record.join('|'));
                                        }, {parallel: 1});

                                        stream.pipe(parser).pipe(xfm);
                                    };

                                    switch(extractor.target.format)
                                    {
                                        case "csv":
                                            parseCSV(',','');
                                        break;
                                        case "tsv":
                                            parseCSV("\t",'');
                                        break;
                                        case "pipe":
                                            parseCSV('|','');
                                        break;
                                        default:
                                            process.nextTick(function(){
                                                callback('onTransformerTest','Invalid target format',null);
                                            });                                    
                                    }

                                });

                            });

                            c.on('error', function(e) {
                                clog('<div class="text-danger">There was an error connecting to the FTP resource.</div>');
                                clog(e);
                                process.nextTick(function(){
                                    callback('onTransformerTest',e,null);
                                });
                            });

                            c.connect({
                                host: src.source.uri,
                                port: src.source.port,
                                user: src.source.auth.username,
                                password: src.source.auth.password
                            });
                        } else if (src.source.type === 'RETS') {
                            clog('<div class="text-info">Extraction source is a RETS resource.</div>');
                            var librets = require('rets-client');

                            var uri = url.parse(src.source.uri);

                            var client = librets.createConnection({
                                host: uri.hostname,
                                port: uri.port,
                                protocol: uri.protocol,
                                path: uri.path,
                                user: src.source.auth.username,
                                pass: src.source.auth.password,
                                version: src.source.version || '1.7.2',
                                agent: { user: src.source.auth.userAgentHeader, password: src.source.auth.userAgentPassword }
                            });

                            client.once('connection.success',function(client){
                                console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                                clog('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>');
                                clog('<div class="text-info">Extracting 10 records via DMQL2 RETS Query.</div>');
                                clog('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
                                clog('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');
                                clog('<div class="text-info">-- Query: '+extractor.target.res+'</div>');
                                var qry = {
                                    SearchType: extractor.target.type,
                                    Class: extractor.target.class,
                                    Query: extractor.target.res,
                                    Format: 'COMPACT-DECODED',
                                    Limit: 10
                                };
                                
                                client.searchQuery(qry, function( error, data ) {

                                    var parseCSV = function(delimiter,quotes,escape){
                                        var libcsv = require('csv-parse');
                                        var errors = false;

                                        var rawheaders = [];
                                        var headers = [];
                                        var records = [];
                                        var trnheaders = [];

                                        transformer.transform.normalize.forEach(function(item, index){
                                            trnheaders.push(item.in);
                                        });

                                        clog('<div class="text-info">Streaming to CSV extraction engine.</div>');
                                        clog('<div class="text-info">Using CSV delimiter: '+delimiter+'</div>');
                                        clog('<div class="text-info">Using quote character: '+quotes+'</div>');
                                        clog('<div class="text-info">Using escape character: "</div>');

                                        var parser = libcsv({delimiter:delimiter, quote: quotes, columns: function(head){
                                            clog('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                            clog('<pre>'+head.join("\n")+'</pre>');
                                            clog('<div class="text-info">Transformer wants the following columns.</div>');
                                            clog('<pre>'+trnheaders.join("\n")+'</pre>');
                                            clog('<div class="text-info">Transformer sampling 10 records...</div>');

                                            rawheaders = head;
                                        }});

                                        parser.on('finish',function(){
                                            clog('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                        });

                                        parser.on('error',function(err){
                                            console.log(err);
                                            clog('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                            process.nextTick(function(){
                                                callback('onTransformerTest','Unable to parse data stream',null);
                                            })
                                        });

                                        var xfm = streamTransform(function(record, cb){
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
                                            clog('<pre>'+rstr+'</pre>');

                                            if (records.length >= 1) {
                                                clog('<div class="text-success">Successfully extracted and parsed '+data.data.length+' records.</div>');
                                                process.nextTick(function(){
                                                    clog('<div class="text-success">Transform completed successfully.</div>');
                                                    if (!errors) callback('onTransformerTest',null,{headers:headers, records:records});
                                                    else callback('onTransformerTest',errors,null);
                                                });
                                                return;
                                            }

                                            cb(null, record.join("\t"));
                                        }, {parallel: 1});

                                        parser.pipe(xfm);
                                        return parser;
                                    };

                                    if (error) {
                                        clog('<div class="text-danger">Query did not execute.</div>');
                                        clog('<pre class="text-danger">'+JSON.stringify(error,2)+'</pre>');
                                        console.log(error);
                                        callback('onExtractorTest',error, null);
                                        return;
                                    } else if (data.type == 'status') {
                                        clog('<div class="text-warning">'+data.text+'</div>');
                                        if (!data.data || !data.data.length) clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                        callback('onExtractorTest',null,{data:data});
                                        return;
                                    } else {
                                        if (!data.data || !data.data.length) {
                                            clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                            callback('onExtractorTest',null,{data:data});
                                            return;
                                        }
                                        if (data.data && data.data.length) {
                                            clog('<div class="text-info">Parsing extracted records.</div>');
                                            var p = parseCSV("\t",'');
                                            p.write(data.data);
                                            p.end();
                                        }
                                    }
                                }, function(stream){
                                    console.log('stream');
                                    stream.once('close', function(){ 
                                        clog('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                        console.log('stream CLOSE');
                                    });
                                    stream.once('end', function(){ 
                                        clog('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                        console.log('stream END');
                                    });

                                    stream.pipe(process.stdout);
                                });
                            });

                            client.once('connection.error',function(error, client){
                                console.error( 'Connection failed: %s.', error.message );
                                callback('onExtractorTest',error, null);
                            });
                        }
                    }
                    else {
                        clog('<div class="text-danger">Extraction source is bad.</div>');
                        callback('onTransformerTest',err,null);
                    }
                });
            }
        })
    },
    saveTransformer: function(transformer, callback) {
        DataManager.transformerSave(transformer, function(err, body){
            callback('onTransformerSave',err,body);
        });
    },
    validateLoaderConnection: function(loader, callback) {
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
    createLoaderSchema: function(loader, callback) {
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
    testLoader: function(loader, callback, client) {
        var clog = function(e){
            client.send('{ "event":"log-stream", "target": "loader-log-body", "body":'+JSON.stringify(e)+'}');
        };

        // console.log(transformer);
        //We want to pipe transformer events back to the client
        db.get(loader.transform, function(err, transformer){
            db.get(transformer.extractor,function(err, extractor){
                if (!err) {

                    clog('<div class="text-info">Testing loader from transformer: '+ transformer.name + '</div>');
                    clog('<div class="text-info">Extracting from source: '+ extractor.source + '</div>');
                    DataManager.getSource(extractor.source,function(err, body){
                        if (!err) {
                            clog('<div class="text-success">Extraction source is valid.</div>');
                            var src = body;
                            if (src.source.type === 'FTP') {

                                clog('<div class="text-info">Extraction source is an FTP resource.</div>');
                                var client = require('ftp');
                                var c = new client();

                                c.on('ready', function() {
                                    clog('<div class="text-success">Connection established.</div>');
                                    clog('<div class="text-info">Searching for extraction target.</div>');

                                    c.get(extractor.target.res, function(err, stream){
                                        if (err) {
                                            clog('<div class="text-danger">Unable to retrieve source file from remote file-system.</div>');
                                            clog(err);
                                            console.log(err);
                                            process.nextTick(function(){
                                                callback('onLoaderTest',err,null);
                                            });
                                            return;
                                        }

                                        clog('<div class="text-success">Discovered source file on remote file-system.</div>');
                                        stream.once('close', function(){ 
                                            clog('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                            c.end(); 
                                        });

                                        var parseCSV = function(delimiter,quotes,escape){
                                            var libcsv = require('csv-parse');
                                            var errors = false;

                                            var rawheaders = [];
                                            var headers = [];
                                            var records = [];
                                            var trnheaders = [];


                                            var mysql = require('mysql');

                                            var dsn = utility.dsn(loader.target.dsn);
                                            var connection = mysql.createConnection({
                                                host: dsn.host,
                                                user: dsn.user,
                                                password: dsn.password,
                                                database: dsn.database
                                            });

                                            var qry = 'INSERT INTO '+loader.target.schema.name+' SET ?';

                                            transformer.transform.normalize.forEach(function(item, index){
                                                trnheaders.push(item.in);
                                            });

                                            clog('<div class="text-info">Streaming to CSV extraction engine.</div>');
                                            clog('<div class="text-info">Using CSV delimiter: '+delimiter+'</div>');
                                            clog('<div class="text-info">Using quote character: '+quotes+'</div>');
                                            clog('<div class="text-info">Using escape character: "</div>');

                                            var parser = libcsv({delimiter:delimiter, quote: quotes, columns: function(head){
                                                clog('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                                clog('<pre>'+head.join("\n")+'</pre>');
                                                clog('<div class="text-info">Transformer wants the following columns.</div>');
                                                clog('<pre>'+trnheaders.join("\n")+'</pre>');
                                                clog('<div class="text-info">Transformer sampling 10 records...</div>');

                                                rawheaders = head;
                                            }});

                                            parser.on('finish',function(){
                                                clog('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                            });

                                            parser.on('error',function(err){
                                                console.log(err);
                                                clog('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                                process.nextTick(function(){
                                                    callback('onLoaderTest','Unable to parse data stream',null);
                                                })
                                            });

                                            var xfm = streamTransform(function(record, cb){
                                                if (records.length >= 25) {
                                                    process.nextTick(function(){
                                                        clog('<div class="text-success">Transform completed successfully.</div>');
                                                        if (!errors) callback('onLoaderTest',null,{headers:headers, records:records});
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

                                                connection.query(qry,rec,function(err,res){
                                                    if (!err) {
                                                        clog('<div class="text-success">Successfully created new record in target: '+dsn.database+'.'+loader.target.schema.name+'</div>');
                                                    }
                                                });
                                                records.push(rec);
                                                clog('<pre>'+rstr+'</pre>');

                                                cb(null, record.join('|'));
                                            }, {parallel: 1});


                                            stream.pipe(parser).pipe(xfm);
                                        };

                                        switch(extractor.target.format)
                                        {
                                            case "csv":
                                                parseCSV(',','');
                                            break;
                                            case "tsv":
                                                parseCSV("\t",'');
                                            break;
                                            case "pipe":
                                                parseCSV('|','');
                                            break;
                                            default:
                                                process.nextTick(function(){
                                                    callback('onLoaderTest','Invalid target format',null);
                                                });                                    
                                        }

                                    });

                                });

                                c.on('error', function(e) {
                                    clog('<div class="text-danger">There was an error connecting to the FTP resource.</div>');
                                    clog(e);
                                    process.nextTick(function(){
                                        callback('onLoaderTest',e,null);
                                    });
                                });

                                c.connect({
                                    host: src.source.uri,
                                    port: src.source.port,
                                    user: src.source.auth.username,
                                    password: src.source.auth.password
                                });
                            } else if (src.source.type === 'RETS') {
                                clog('<div class="text-info">Extraction source is a RETS resource.</div>');
                                var librets = require('rets-client');

                                var uri = url.parse(src.source.uri);

                                var client = librets.createConnection({
                                    host: uri.hostname,
                                    port: uri.port,
                                    protocol: uri.protocol,
                                    path: uri.path,
                                    user: src.source.auth.username,
                                    pass: src.source.auth.password,
                                    version: src.source.version || '1.7.2',
                                    agent: { user: src.source.auth.userAgentHeader, password: src.source.auth.userAgentPassword }
                                });

                                clog('<div class="text-info">Connecting to RETS data source.</div>');
                                client.once('connection.success',function(client){
                                    console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                                    clog('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>');
                                    clog('<div class="text-info">Extracting 1000 records via DMQL2 RETS Query.</div>');
                                    clog('<div class="text-info">-- Resource/SearchType: '+extractor.target.type+'</div>');
                                    clog('<div class="text-info">-- Classification: '+extractor.target.class+'</div>');
                                    clog('<div class="text-info">-- Query: '+extractor.target.res+'</div>');
                                    var qry = {
                                        SearchType: extractor.target.type,
                                        Class: extractor.target.class,
                                        Query: extractor.target.res,
                                        Format: 'COMPACT-DECODED',
                                        Limit: 1000
                                    };
                                    
                                    client.searchQuery(qry, function( error, data ) {
                                        clog('<div class="text-success">Successfully retrieved RETS data from provider.</div>');

                                        var parseCSV = function(delimiter,quotes,escape){
                                            var libcsv = require('csv-parse');
                                            var errors = false;

                                            var rawheaders = [];
                                            var headers = [];
                                            var records = [];
                                            var trnheaders = [];
                                            var transformed = 0;
                                            var loaded = 0;

                                            var mysql = require('mysql');

                                            var dsn = utility.dsn(loader.target.dsn);
                                            var connection = mysql.createConnection({
                                                host: dsn.host,
                                                user: dsn.user,
                                                password: dsn.password,
                                                database: dsn.database
                                            });

                                            var qry = 'INSERT INTO '+loader.target.schema.name+' SET ?';

                                            transformer.transform.normalize.forEach(function(item, index){
                                                trnheaders.push(item.in);
                                            });

                                            clog('<div class="text-info">Streaming to CSV extraction engine.</div>');
                                            clog('<div class="text-info">Using CSV delimiter: '+delimiter+'</div>');
                                            clog('<div class="text-info">Using quote character: '+quotes+'</div>');
                                            clog('<div class="text-info">Using escape character: "</div>');

                                            var parser = libcsv({delimiter:delimiter, quote: quotes, columns: function(head){
                                                clog('<div class="text-success">CSV extraction engine found the following column headers.</div>');
                                                clog('<pre>'+head.join("\n")+'</pre>');
                                                clog('<div class="text-info">Transformer wants the following columns.</div>');
                                                clog('<pre>'+trnheaders.join("\n")+'</pre>');
                                                clog('<div class="text-info">Transformer sampling 10 records...</div>');

                                                rawheaders = head;
                                            }});

                                            parser.on('finish',function(){
                                                clog('<div class="text-success">CSV extraction engine completed reading and parsing data source.</div>');
                                            });

                                            parser.on('error',function(err){
                                                console.log(err);
                                                clog('<div class="text-danger">CSV extraction engine was unable to parse the data stream.</div>');
                                                process.nextTick(function(){
                                                    callback('onLoaderTest','Unable to parse data stream',null);
                                                })
                                            });

                                            var xfm = streamTransform(function(record, cb){
                                                var rec = {};
                                                var rstr = '{\n';
                                                transformer.transform.normalize.forEach(function(item, index){
                                                    var i = rawheaders.indexOf(item.in);
                                                    if (headers.indexOf(item.out) === -1) headers[i] = item.out;
                                                    rec[item.out] = record[i];
                                                    rstr += '    "'+item.out+'" : "'+record[i]+'",\n';
                                                });
                                                rstr += '}'
                                                transformed++;
                                                clog('<div class="text-success">Record '+ transformed +' transformed</div>');
                                                // clog('<pre>'+rstr+'</pre>');

                                                connection.query(qry,rec,function(err,res){
                                                    loaded++;
                                                    if (!err) {
                                                        clog('<div class="text-success">Successfully created new record '+ loaded +' in target: '+dsn.database+'.'+loader.target.schema.name+'</div>');
                                                    }

                                                    if (loaded >= 1000) {
                                                        clog('<div class="text-success">Load completed successfully.</div>');
                                                        process.nextTick(function(){
                                                            clog('<div class="text-success">Successfully extracted, transformed and loaded '+records.length+' records.</div>');
                                                            if (!errors) callback('onLoaderTest',null,{headers:headers, records:records});
                                                            else callback('onLoaderTest',errors,null);
                                                        });
                                                        return;
                                                    }
                                                });

                                                records.push(rec);

                                                if (records.length >= 1000) {
                                                    clog('<div class="text-success">Successfully transformed '+records.length+' records.</div>');
                                                    clog('<div class="text-success">Transform completed successfully.</div>');
                                                    return; // Stop processing
                                                }

                                                cb(null, record.join("\t")+"\n");
                                            }, {parallel: 1});

                                            parser.pipe(xfm);
                                            return parser;
                                        };

                                        if (error) {
                                            clog('<div class="text-danger">Query did not execute.</div>');
                                            clog('<pre class="text-danger">'+JSON.stringify(error,2)+'</pre>');
                                            console.log(error);
                                            callback('onLoaderTest',error, null);
                                            return;
                                        } else if (data.type == 'status') {
                                            clog('<div class="text-warning">'+data.text+'</div>');
                                            if (!data.data || !data.data.length) clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                            callback('onLoaderTest',null,{data:data});
                                            return;
                                        } else {
                                            if (!data.data || !data.data.length) {
                                                clog('<div class="text-info">'+data.text+'<br>Just because there were no records doesn\'t mean your query was bad, just no records that matched. Try playing with your query.</div>');
                                                callback('onLoaderTest',null,{data:data});
                                                return;
                                            }
                                            if (data.data && data.data.length) {
                                                clog('<div class="text-info">Parsing extracted records.</div>');
                                                var p = parseCSV("\t",'');
                                                p.write(data.data);
                                                p.end();
                                            }
                                        }
                                    }, function(stream){
                                        // console.log('stream');
                                        stream.once('close', function(){ 
                                            clog('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                            console.log('stream CLOSE');
                                        });
                                        stream.once('end', function(){ 
                                            clog('<div class="text-success">Completed reading source file from remote file-system.</div>');
                                            console.log('stream END');
                                        });

                                        stream.pipe(process.stdout);
                                    });
                                });

                                client.once('connection.error',function(error, client){
                                    console.error( 'Connection failed: %s.', error.message );
                                    callback('onLoaderTest',error, null);
                                });
                            }
                        }
                        else {
                            clog('<div class="text-danger">Extraction source is bad.</div>');
                            callback('onLoaderTest',err,null);
                        }
                    });
                }
            })            
        })

    },
    saveLoader: function(loader, callback) {
        DataManager.loaderSave(loader, function(err, body){
            callback('onLoaderSave',err,body);
        });
    },
    validateSource: function(source, callback) {

        switch(source.type)
        {
            case "FTP":
                console.log('FTP Client Test');
                var client = require('ftp');
                var c = new client();

                c.on('ready', function() {
                    c.list(function(err, list) {
                      if (err) {
                        process.nextTick(function(){
                            callback('onvalidate',err,null);
                        });
                        return;
                      }
                      c.end();
                      process.nextTick(function(){
                        callback('onvalidate',null,{success:true})
                      })
                    });
                });

                c.on('error', function(e) {
                    console.trace(e);
                    process.nextTick(function(){
                        callback('onvalidate',e,null);
                    });
                });

                c.connect({
                    host: source.uri,
                    port: source.port,
                    user: source.auth.username,
                    password: source.auth.password
                });
            break;
            case "RETS":
                var librets = require('rets-client');

                var uri = url.parse(source.uri);

                var client = librets.createConnection({
                    host: uri.hostname,
                    port: uri.port,
                    protocol: uri.protocol,
                    path: uri.path,
                    user: source.auth.username,
                    pass: source.auth.password,
                    version: source.version || '1.7.2',
                    agent: { user: source.auth.userAgentHeader, password: source.auth.userAgentPassword }
                });

                client.once('connection.success',function(client){
                    console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                    callback('onvalidate',null,{success:true});
                });

                client.once('connection.error',function(error, client){
                    console.error( 'Connection failed: %s.', error.message );
                    callback('onvalidate',error, null);
                });
            break;
        }
    },
    saveSource: function(source, callback) {
        DataManager.sourceSave(source, function(err, body){
            callback('onsave',err,body);
        });
    }
};