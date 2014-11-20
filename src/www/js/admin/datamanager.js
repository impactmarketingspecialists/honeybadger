	var DataManager = new (function(){
		// We hate polluting global scope; this is a great way to avoid that
		var ts,tp,socket,host = "ws://"+location.host+"/admin/";
		var _self = this;


		/* dan is cools */

		/**
		 * Utility methods
		 */
		function connect()
		{
			if (ts) clearInterval(ts);
			if (tp) clearInterval(tp);

			socket = new WebSocket(host);
			socket.onopen = function(){
				update('connectionStatus',{online:true});
				_self.refresh();
				_self.alert('Connected to server.');
				if (ts) clearInterval(ts);
				tp = setInterval(function(){
					socket.send('ping');
				}, 15000);
			};

			socket.onclose = function(){
				if (tp) clearInterval(tp);
				update('connectionStatus',{online:false});
				_self.alert('Connection to server lost. Trying to restablish connection with the server.',{type:'danger'});
				ts = setInterval(connect, 1000);
			};

			_self.bind(socket);
			return socket;
		}

		var Emit = Emitter(this);

		var self = this;
		var __cbqueue = {},
			sources = [],
			extractors = [],
			transformers = [],
			loaders = [],
			pages = {
				dashboard: $('#dashboard').hide(),
				sourceManager: $('#sourceManager').hide(),
				extractorManager: $('#extractorManager').hide(),
				transformManager: $('#transformManager').hide(),
				loaderManager: $('#loaderManager').hide()
			},
			localDev = ( window.location.host == "localhost:8090" ) ? true : false;

		var receive = function(e) {
			if (e.data === 'pong') return;

			var d = JSON.parse(e.data);
			if( localDev ){ console.dir( d ); }
			var msig = d.msig || null;
			if (msig && __cbqueue[msig]) {
				__cbqueue[msig](d);
				delete __cbqueue[msig];
				return;
			}
			if (d.event == 'log-stream') {
				$('#'+d.target).append(d.body);
			}
		};

		var send = function(method, args, callback){
			var args = args || [];
			msig = (callback) ? (new Date().getTime() * Math.random(1000)).toString(36) : null;
			if (msig) { __cbqueue[msig] = callback }
			if( localDev ){ console.trace(); console.dir({method:method,msig:msig,args:args}); }
			socket.send(JSON.stringify({method:method,msig:msig,args:args}));
		};

		this.bind = function(socket) {
			socket.onmessage = receive;
		};

		this.alert = function(msg, opts){
			if (arguments.length == 1) {
				var opts = (typeof msg === 'string') ? {
						msg: msg,
					} : msg;
			}

			var opts = opts || {};
			opts.type = opts.type || 'info';
			opts.msg = opts.msg || msg;
			opts.hide = opts.hide || 3;

			$('#alerts').prepend($('<div class="alert alert-'+opts.type+' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+opts.msg+'</div>').slideDown().delay( opts.hide * 1000 ).fadeOut(function(){
				$(this).remove();
			}));
		};

		this.list = function(id){
			send('list',null,function(e){
				if (!e.err) {
					// console.log(e);
					sources = e.body;
					// update('sourceLists',sources);
				}
			});
		};

		this.getExtractorList = function(){
			send('getExtractorList',null,function(e){
				if(!e.err) {
					extractors = e.body;
					// update('extractorLists', extractors);
				}
			});
		};

		this.getTransformerList = function(){
			send('getTransformerList',null,function(e){
				if(!e.err) {
					transformers = e.body;
					// update('transformerLists', transformers);
				}
			});
		};

		this.getLoaderList = function(){
			send('getLoaderList',null,function(e){
				if(!e.err) {
					loaders = e.body;
					// update('loaderLists', loaders);
				}
			});
		};

		this.refresh = function(){
			this.list();
			this.getExtractorList();
			this.getTransformerList();
			this.getLoaderList();
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

		this.ftpBrowse = function(source, callback)
		{
			send('browseFTP',[source],callback);
		};

		this.retsExplore = function(source, callback)
		{
			send('exploreRETS',[source],callback);
		};

		this.retsBrowse = function(source, callback)
		{
			send('browseRETS',[source],callback);
		};

		this.retsInspect = function(source, callback)
		{
			send('inspectRETS',[source],callback);
		};

		this.source = function(name, type, properties){

		};

		this.extractor = {};
		this.extractor.validate = function(){

		};

		this.extractor.save = function(ext){
			send('saveExtractor', [ext], function(e){
				console.log(e);
			});
		};

		this.extractor.sample = function(ext, cb){
			send('testExtractor', [ext], function(e){
				cb(e);
			});
		};

		this.transformer = {};
		this.transformer.validate = function(){

		};

		this.transformer.save = function(trn){
			send('saveTransformer', [trn], function(e){
				console.log(e);
			});
		};

		this.transformer.sample = function(trn, cb){
			send('testTransformer', [trn], function(e){
				cb(e);
			});
		};

		this.loader = {};
		this.loader.validate = function(){

		};

		this.loader.validateConnection = function(ldr, cb){
			send('validateLoaderConnection', [ldr], function(e){
				cb(e);
			});
		};

		this.loader.createSchema = function(ldr, cb){
			send('createLoaderSchema', [ldr], function(e){
				cb(e);
			});
		};

		this.loader.save = function(ldr){
			send('saveLoader', [ldr], function(e){
				// console.log(e);
				cb(e);
			});
		};

		this.loader.sample = function(ldr, cb){
			send('testLoader', [ldr], function(e){
				// console.log(e);
				cb(e);
			});
		};

		this.source.validate = function(src){

			var src = {},
				type = $('#sourcetype').val();

			switch(type) {
				case "RETS":
					src.uri = $('#sourceuri').val();
					src.type = type;
					src.auth = {
						username: $('#sourceuser').val(),
						password: $('#sourcepassword').val(),
						userAgentHeader: $('#sourceua').val(),
						userAgentPassword: $('#sourceuapw').val()
					};
				break;
				case "FTP":
					src.uri = $('#ftphost').val();
					src.type = type;
					src.port = 21;
					src.auth = {
						username: $('#ftpuser').val(),
						password: $('#ftpauth').val()
					};
				break;
			}

			$('#sourceValidationStatus').removeClass('glyphicon-ok-sign glyphicon-exclamation-sign').addClass(' glyphicon-asterisk');
			// $('#validateBtn').attr('disabled','disabled');

			send('validateSource',[src],function(e){
				$('#validateBtn').removeClass('btn-danger btn-success').addClass('btn-primary');
				if (!e.err) {
					$('#validateBtn').removeClass('btn-primary').addClass('btn-success')
					$('#sourceValidationStatus').removeClass('glyphicon-asterisk').addClass('glyphicon-ok-sign');
					$('#sourceEditorSave').prop('disabled',false);
				} else {
					$('#validateBtn').removeAttr('disabled').removeClass('btn-primary').addClass('btn-danger')
					$('#sourceValidationStatus').removeClass('glyphicon-asterisk').addClass('glyphicon-exclamation-sign');
					$('#sourceEditorSave').prop('disabled',true);
				}
			});
		};
		this.source.save = function(){

			if (!$('#sourcename').val()) return false;

			var type = $('#sourcetype').val(),
				src = {	name: $('#sourcename').val() },
				src_id = $('#sourceEditor').attr('data-id'),
				src_rev = $('#sourceEditor').attr('data-rev');
			if( src_id ){ src._id = src_id; }
			if( src_rev ){ src._rev = src_rev; }

			switch(type)
			{
				case "RETS":
					src.source = {
						uri: $('#sourceuri').val(),
						type: type,
						version: '1.5',
						auth: {
							username: $('#sourceuser').val(),
							password: $('#sourcepassword').val(),
							userAgentHeader: $('#sourceua').val(),
							userAgentPassword: $('#sourceuapw').val()
						}
					};
				break;
				case "FTP":
					src.source = {
						uri: $('#ftphost').val(),
						type: type,
						auth: {
							username: $('#ftpuser').val(),
							password: $('#ftpauth').val()
						}
					};
				break;
				case "SOAP":
				break;
				case "REST":
				break;
				case "XML":
				break;
			}

			send('saveSource',[src],function(e){
				DataManager.refresh();
			});

			sourceModalReset();
			$('#sourceEditor').modal('hide');
		};

		this.navigate = function(page, callback){
			if (typeof pages[page] == 'undefined') return false;

			$('#bs-example-navbar-collapse-1 li.active').removeClass('active');
			$('[data-target="'+page+'"]').closest('.nav-item').addClass('active');
			$('#bodyContent > *').hide();
			pages[page].show();
		};

		$('[data-toggle="page"]').each(function(index,item){
			$(item).click(function(){
				DataManager.navigate($(this).attr('data-target'));
			});
		});

		connect();

	})();
