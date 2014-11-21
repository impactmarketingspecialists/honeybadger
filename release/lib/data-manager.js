module.exports = new (function(){
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
            source.type = 'dsn'; // Set the document type to Data Source Name // added by dan to ensure these are set since they do not have a field to change them
            source.status = 'active'; // Activate the source // added by dan to ensure these are set since they do not have a field to change them
            db.insert(source, source._id, callback);
        };

        var _newSource = function(){
            source.type = 'dsn'; // Set the document type to Data Source Name
            source.status = 'active'; // Activate the source
            source.activatedOn = Date.now();
            db.insert(source, null, function(err, body){
                refreshSources();
                if (callback) callback(err, body);
            });
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
            db.insert(extractor, null, function(err,body){
                refreshExtractors();
                if (callback) callback(err, body);
            });
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
            db.insert(transformer, null, function(err,body){
                refreshTransformers();
                if (callback) callback(err, body);
            });
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
            db.insert(loader, null, function(err, body){
                refreshLoaders();
                if (callback) callback(err, body);
            });
        };

        if (loader._id) _updateLoader();
        else _newLoader();
    };

    this.refresh();
});