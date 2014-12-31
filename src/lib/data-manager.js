module.exports = new (function(){
    var sources = [],
        extractors = [],
        transformers = [],
        loaders = [],
        tasks = [],
        programs = [];

    var refreshSources = function(callback){
        db.view('sources', 'list', function(err, body) {
            if(!err) {
                sources = [];
                body.rows.forEach(function(doc){
                    sources.push(doc);
               });
            } else console.trace(err);
            if(callback) callback(err, body);
        });
    };

    var refreshExtractors = function(callback){
        db.view('extractors', 'list', function(err, body) {
            if(!err) {
                extractors = [];
                body.rows.forEach(function(doc){
                    extractors.push(doc);
               });
            } else console.trace(err);
            if(callback) callback(err, body);
        });
    };

    var refreshTransformers = function(callback){
        db.view('transformers', 'list', function(err, body) {
            if(!err) {
                transformers = [];
                body.rows.forEach(function(doc){
                    transformers.push(doc);
               });
            } else console.trace(err);
            if(callback) callback(err, body);
        });
    };

    var refreshLoaders = function(callback){
        db.view('loaders', 'list', function(err, body) {
            if(!err) {
                loaders = [];
                body.rows.forEach(function(doc){
                    loaders.push(doc);
               });
            } else console.trace(err);
            if(callback) callback(err, body);
        });
    };

    var refreshTasks = function(callback){
        db.view('tasks', 'list', function(err, body) {
            if(!err) {
                tasks = [];
                body.rows.forEach(function(doc){
                    tasks.push(doc);
               });
            } else console.trace(err);
            if(callback) callback(err, body);
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

    Object.defineProperty(this, "tasks", {
        get: function() { return tasks; }
    });

    this.refresh = function(){
        refreshSources();
        refreshExtractors();
        refreshTransformers();
        refreshLoaders();
        refreshTasks();
    };

    this.sourceDetail = function(id) {
        return sources.filter(function(e) {
            return e._id === id;
        });
    };

    this.getTask = function(id){
        return tasks.filter(function(item){
            if (item.id === id) return item;
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
            source.activatedOn = Date.now();
            db.insert(source, null, function(err, body){
                refreshSources(function(){
                    if (callback) callback(err, body);
                });
            });
        };

        var _newSource = function(){
            source.type = 'dsn'; // Set the document type to Data Source Name
            source.status = 'active'; // Activate the source
            source.activatedOn = Date.now();
            db.insert(source, null, function(err, body){
                refreshSources(function(){
                    if (callback) callback(err, body);
                });
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
            extractor.type = 'extractor'; // Set the document type to Data Source Name
            extractor.status = 'active'; // Activate the source
            extractor.activatedOn = Date.now();

            db.insert(extractor, extractor._id, function(err,body){
               refreshExtractors(function(){
                    if (callback) callback(err, body);
                });
            });
        };

        var _newExtractor = function(){
            extractor.type = 'extractor'; // Set the document type to Data Source Name
            extractor.status = 'active'; // Activate the source
            extractor.activatedOn = Date.now();
            db.insert(extractor, null, function(err,body){
                refreshExtractors(function(){
                    if (callback) callback(err, body);
                });
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

            transformer.type = 'transformer'; // Set the document type to Data Source Name
            transformer.status = 'active'; // Activate the source
            transformer.activatedOn = Date.now();
            db.insert(transformer, transformer._id, function(err,body){
                refreshTransformers(function(){
                    if (callback) callback(err, body);
                });
            });
        };

        var _newTransformer = function(){
            transformer.type = 'transformer'; // Set the document type to Data Source Name
            transformer.status = 'active'; // Activate the source
            transformer.activatedOn = Date.now();
            db.insert(transformer, null, function(err,body){
                refreshTransformers(function(){
                    if (callback) callback(err, body);
                });
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

            loader.type = 'loader'; // Set the document type to Data Source Name
            loader.status = 'active'; // Activate the source
            loader.activatedOn = Date.now();
            db.insert(loader, loader._id, function(err, body){
                refreshLoaders(function(){
                    if (callback) callback(err, body);
                });
            });
        };

        var _newLoader = function(){
            loader.type = 'loader'; // Set the document type to Data Source Name
            loader.status = 'active'; // Activate the source
            loader.activatedOn = Date.now();
            db.insert(loader, null, function(err, body){
                refreshLoaders(function(){
                    if (callback) callback(err, body);
                });
            });
        };

        if (loader._id) _updateLoader();
        else _newLoader();
    };

    this.taskSave = function(task, callback) {

        var _updateTask = function(){
            if (!task._rev) {
                console.log('Document has no _rev; cannot update');
                console.trace();
                callback({err:true,body:'Document has no _rev; cannot update'});
                return false;
            }

            task.type = 'task';
            task.status = 'active';
            task.activatedOn = Date.now();
            db.insert(task, task._id, function(err, body){
                refreshTasks(function(){
                    if (callback) callback(err, body);
                });
            });
        };

        var _newTask = function(){
            task.type = 'task';
            task.status = 'active';
            task.activatedOn = Date.now();
            db.insert(task, null, function(err, body){
                refreshTasks(function(){
                    if (callback) callback(err, body);
                });
            });
        };

        if (task._id) _updateTask();
        else _newTask();
    };


    this.refresh();
});