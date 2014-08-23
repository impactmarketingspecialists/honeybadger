var fs = require('fs');
var path = require('path');
var url = require('url');
var express = require('express');
var app = new express();
var http = require('http').createServer(app);
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: http });
var async = require('async');
var nano = require('nano')('http://localhost:5984');
var db = nano.use('honeybadger');
var feed = db.follow({since: "now"});
var streamTransform = require('stream-transform');

var http_port = 8090;

function parseDSN(dsn) {
  var args;

  var components = require('url').parse(dsn);

  // DSN is not a plain hostname?
  if (components.hostname) {
    // Guard protocol
    if (components.protocol !== 'mysql:') {
      throw new Error("mysql-libmysqlclient supports only connections to MySQL server");
    }

    var
      hostname = components.hostname,
      port     = components.port,
      auth     = components.auth.split(':'),
      user     = auth.shift(),
      password = auth.shift(),
      database = components.pathname
               ? components.pathname.substr(1).replace(/\/.*$/, '').replace(/\?.*$/, '')
               : null,
      socket = null,
      flags = null;

    args = { host: hostname, user: user, password: password, database: database, port: port, socket: socket, flags: flags };
  } else {
    args = [arguments[0]];
  }

  return args;
}

var DataManager = new (function(){
    var sources = [],
        extractors = [],
        transformers = [],
        loaders = [],
        programs = [];

    var refreshSources = function(){
        db.view('sources', 'list', function(err, body) {
            if(!err) {
                sources = [];
                body.rows.forEach(function(doc){
                    sources.push(doc);
               });
            } else console.trace(err);
        });
    };

    var refreshExtractors = function(){
        db.view('extractors', 'list', function(err, body) {
            if(!err) {
                extractors = [];
                body.rows.forEach(function(doc){
                    extractors.push(doc);
               });
            } else console.trace(err);
        });
    };

    var refreshTransformers = function(){
        db.view('transformers', 'list', function(err, body) {
            if(!err) {
                transformers = [];
                body.rows.forEach(function(doc){
                    transformers.push(doc);
               });
            } else console.trace(err);
        });
    };

    var refreshLoaders = function(){
        db.view('loaders', 'list', function(err, body) {
            if(!err) {
                loaders = [];
                body.rows.forEach(function(doc){
                    loaders.push(doc);
               });
            } else console.trace(err);
        });
    };

    Object.defineProperty(this, "sources", {
        get: function() { return sources; }
    });

    Object.defineProperty(this, "extractors", {
        get: function() { return extractors; }
    });

    Object.defineProperty(this, "transformers", {
        get: function() { return transformers; }
    });

    Object.defineProperty(this, "loaders", {
        get: function() { return loaders; }
    });

    this.refresh = function(){
        refreshSources();
        refreshExtractors();
        refreshTransformers();
        refreshLoaders();
    };

    this.sourceDetail = function(id) {
        return sources.find(function(e) {
            return e._id === id;
        });
    };

    this.getSource = function(id, cb) {
        db.get(id, cb);
    };

    this.sourceSave = function(source, callback) {

        var _updateSource = function(){
            if (!source._rev) {
                console.log('Document has no _rev; cannot update');
                console.trace();
                callback({err:true,body:'Document has no _rev; cannot update'});
                return false;
            }

            db.insert(source, source._id, callback);
        };

        var _newSource = function(){
            source.type = 'dsn'; // Set the document type to Data Source Name
            source.status = 'active'; // Activate the source
            source.activatedOn = Date.now();
            db.insert(source, null, callback);
            refreshSources();
        };

        if (source._id) _updateSource();
        else _newSource();
    };

    this.extractorSave = function(extractor, callback) {

        var _updateExtractor = function(){
            if (!extractor._rev) {
                console.log('Document has no _rev; cannot update');
                console.trace();
                callback({err:true,body:'Document has no _rev; cannot update'});
                return false;
            }

            db.insert(extractor, extractor._id, callback);
        };

        var _newExtractor = function(){
            extractor.type = 'extractor'; // Set the document type to Data Source Name
            extractor.status = 'active'; // Activate the source
            extractor.activatedOn = Date.now();
            db.insert(extractor, null, callback);
            refreshExtractors();
        };

        if (extractor._id) _updateExtractor();
        else _newExtractor();
    };

    this.transformerSave = function(transformer, callback) {

        var _updateTransformer = function(){
            if (!transformer._rev) {
                console.log('Document has no _rev; cannot update');
                console.trace();
                callback({err:true,body:'Document has no _rev; cannot update'});
                return false;
            }

            db.insert(transformer, transformer._id, callback);
        };

        var _newTransformer = function(){
            transformer.type = 'transformer'; // Set the document type to Data Source Name
            transformer.status = 'active'; // Activate the source
            transformer.activatedOn = Date.now();
            db.insert(transformer, null, callback);
            refreshTransformers();
        };

        if (transformer._id) _updateTransformer();
        else _newTransformer();
    };

    this.loaderSave = function(loader, callback) {

        var _updateLoader = function(){
            if (!loader._rev) {
                console.log('Document has no _rev; cannot update');
                console.trace();
                callback({err:true,body:'Document has no _rev; cannot update'});
                return false;
            }

            db.insert(loader, loader._id, callback);
        };

        var _newLoader = function(){
            loader.type = 'loader'; // Set the document type to Data Source Name
            loader.status = 'active'; // Activate the source
            loader.activatedOn = Date.now();
            db.insert(loader, null, callback);
            refreshLoaders();
        };

        if (loader._id) _updateLoader();
        else _newLoader();
    };

    this.refresh();
});

var WSAPI = {
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
        DataManager.getSource(source.id,function(err, src){
            if (!err && src.source.type === 'FTP') {
                var client = require('ftp');
                var c = new client();

                c.on('ready', function() {
                    c.list(function(err, list) {
                      if (err) {
                        process.nextTick(function(){
                            callback('onFTPBrowse',err,null);
                        });
                        return;
                      }
                      c.end();
                      process.nextTick(function(){
                        callback('onFTPBrowse',null,{success:true, list: list});
                      })
                    });
                });

                c.on('error', function(e) {
                    console.trace(e);
                    process.nextTick(function(){
                        callback('onFTPBrowse',e,null);
                    });
                });

                c.connect({
                    host: src.source.uri,
                    port: src.source.port,
                    user: src.source.auth.username,
                    password: src.source.auth.password
                });
            }
        });
        // callback('onFTPList', null, {});
    },
    browseRETS: function(source, callback, client){
        DataManager.getSource(source.id,function(err,src){
            var librets = require('rets-client');

            var uri = url.parse(source.source.uri);

            var client = librets.createConnection({
                host: uri.hostname,
                port: uri.port,
                path: uri.path,
                user: source.source.auth.username,
                pass: source.source.auth.password,
                version: source.source.version || '1.5',
                agent: { user: source.source.auth.userAgentHeader }
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
                path: uri.path,
                user: source.source.auth.username,
                pass: source.source.auth.password,
                version: source.source.version || '1.5',
                agent: { user: source.source.auth.userAgentHeader }
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
                path: uri.path,
                user: source.source.auth.username,
                pass: source.source.auth.password,
                version: source.source.version || '1.5',
                agent: { user: source.source.auth.userAgentHeader }
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
    extracRETS: function() {
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
                        path: uri.path,
                        user: src.source.auth.username,
                        pass: src.source.auth.password,
                        version: src.source.version || '1.5',
                        agent: { user: src.source.auth.userAgentHeader }
                    });

                    client.once('connection.success',function(client){
                        console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
                        clog('<div class="text-success">Connected to RETS as '+client.get( 'provider.name' )+'.</div>');
                        clog('<div class="text-info">Extracting 10 records via DMQL2 RETS Query.</div>');
                        clog('<div class="text-info">-- Resource/SearchType: Property</div>');
                        clog('<div class="text-info">-- Classification: A (Residential)</div>');
                        clog('<div class="text-info">-- Query: (LIST_87=2014-07-01T00:00:00+)</div>');
                        var qry = {
                            SearchType: 'Property',
                            Class: 'A',
                            Query: '(LIST_87=2014-08-15T00:00:00+)',
                            Limit: 10
                        };
                        client.searchQuery(qry, function( error, data ) {
                            if (error) {
                                clog('<div class="text-danger">Query did not execute.</div>');
                                clog('<pre class="text-danger">'+JSON.stringify(error)+'</pre>');
                                console.log(error);
                            } else {
                                data.data.forEach(function(item,index){
                                    clog('<pre>'+JSON.stringify(item)+'</pre>');
                                });
                                clog('<div class="text-success">Successfully extracted and parsed '+data.data.length+' records.</div>');
                                callback('onExtractorTest',null,{query:qry, count: data.data.length});
                                // console.log( require( 'util' ).inspect( data, { showHidden: false, colors: true, depth: 5 } ) )
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

                var dsn = parseDSN(loader.target.dsn);
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

                var dsn = parseDSN(loader.target.dsn);
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

                                            var dsn = parseDSN(loader.target.dsn);
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
                    path: uri.path,
                    user: source.auth.username,
                    pass: source.auth.password,
                    version: source.version || '1.5',
                    agent: { user: source.auth.userAgentHeader }
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
}

var baseURL = '/data-manager';
app.use(baseURL+'/', express.static(path.resolve('www/'))); // Path resolve clears forbidden exception
app.use(baseURL+'/js', express.static('www/js/'));
app.use(baseURL+'/css', express.static('www/css/'));
app.use(baseURL+'/images', express.static('www/images/'));
app.use(baseURL+'/fonts', express.static('www/fonts/'));

// app.get(baseURL+'/',function(req, res){
//     res.status(200).set('Content-Type', 'text/html').send('OK');
// });

app.get(baseURL+'/download',function(req,res){
});

app.post(baseURL+'/upload',function(req, res){
});

wss.on('connection',function(ws) {
    // var connection = request.accept(null, request.origin);
    // clients.push(connection);

    console.log('WebSocket connection accepted');

    ws.on('message',function(message, flags){
        // console.log('WebSocket message received',message);
        
        if (!message) { 
            console.log('WebSocket empty message');
            ws.send('Error: malformed request');
            return false; 
        }

        if (message === 'ping') return ws.send('pong');

        var data = JSON.parse(message);
        if (!data) {
            console.log('WebSocket bad message');
            ws.send('Error: malformed request');
            return false; 
        }

        if (WSAPI[data.method]) {
        	var args = [];
			if(data.args) {
				data.args.forEach(function(item){
					args.push(item);
				});
			}
        	args.push(function(event, err, body){
			    ws.send(JSON.stringify({
                    event: event,
                    msig: data.msig || null,
                    err:err,
                    body:body
                }));
			});
            args.push(ws)
			// console.dir(args);
        	WSAPI[data.method].apply(this, args);
        } else {
            console.log('Method '+data.method+' does not exist');
            ws.send('Error: malformed request');
            return false;         	
        }
    });

    ws.on('close',function(connection){
    	// clients.slice(clients.indexOf(connection),1);
        console.log('Websocket connection closed');
    });
});


feed.on('change', function (change) {
    DataManager.refresh();
});
feed.follow();

http.listen(http_port);

exports.DataManager = DataManager;