var ts;
var socket;
var host = "ws://"+location.hostname+":8090/";

var events = {
	onsave: function(res){
	},
	onlist: function(res){
	},
	onload: function(res){
	},
	ondestroy: function(res){
	}
};

function update(element,data)
{
	var connectionStatus = function(d) {
		if (d.online && d.online === true) {
			$('#connection').addClass('online').removeClass('offline');
			$('#connection .status').text('Online');
		}
		else {
			$('#connection').addClass('offline').removeClass('online');
			$('#connection .status').text('Offline');
		}
	};

	var sourceLists = function(d) {
		$('#activeSources > tbody').html('');
		$('#inactiveSources > tbody').html('');
		$('#sourceList > tbody').html('');
		$('#ext-source-select').html('');
		$(d).each(function(index, item){
			$('#sourceList > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>')
			$('#ext-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');
			if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
			else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
		});
	};

	var extractorLists = function(d) {
		$('#extractorList > tbody').html('');
		$('#trn-source-select').html('<option value="">-- Select extractor --</option>');
		$(d).each(function(index, item){
			$('#trn-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');
			$('#extractorList > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>');
			// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
			// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
		});
	};

	var transformerLists = function(d) {
		$('#transformerList > tbody').html('');
		$('#ldr-source-select').html('<option value="">-- Select transformer --</option>');
		$(d).each(function(index, item){
			$('#ldr-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');
			$('#transformerList > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>');
			// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
			// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
		});
	};

	var loaderLists = function(d) {
		$('#loaderList > tbody').html('');
		$(d).each(function(index, item){
			$('#loaderList > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>');
			// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
			// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
		});
	};

	var transformDataStructures = function(d) {
		$('#transformNormalize').html('');
		$('#transformMapper .fields').html('');
		$.each(d.headers,function(index,item){
			$('#transformNormalize').append('<label class="row item"><div class="col-md-6 form-inline"><label><input type="checkbox" checked/><span class="name">'+item+'</span></label></div><div class="col-md-6"><input type="text" class="form-control" value="'+item+'"/></div></label>')
			$('#transformMapper .fields').append('<span class="item badge">'+item+'</span> ');
		});

		$('#transformNormalize input:checkbox').change(function(){
			if (!$(this)[0].checked) $(this).parent().parent().parent().find('input[type="text"]').attr('disabled','disabled');
			else $(this).parent().parent().parent().find('[type=text]').removeAttr('disabled');
		})
	};

	var loaderDefinition = function(d) {
		$('#loaderSchemas .fields .maps').html('');
		$.each(d.headers,function(index,item){
			if (!item) return;
			$('#loaderSchemas .fields .maps').append('<div class="row form-group"><div class="col-md-6"><label>'+item+'</label></div><div class="col-md-6"><select class="form-control"><option value="string">String</option><option value="float">Float</option><option value="bool">Boolean</option><option value="text">Long Text</option></select></div></div>')
		})
	};

	switch(element)
	{
		case "connectionStatus":
			connectionStatus(data);
		break;
		case "sourceLists":
			sourceLists(data);
		break;
		case "extractorLists":
			extractorLists(data);
		break;
		case "transformerLists":
			transformerLists(data);
		break;
		case "loaderLists":
			loaderLists(data);
		break;
		case "dataStructures":
			transformDataStructures(data);
		break;
		case "loaderDefinition":
			loaderDefinition(data);
		break;
	}
}

function connect()
{
	if (ts) clearInterval(ts);
	socket = new WebSocket(host);
	socket.onopen = function(){
		update('connectionStatus',{online:true});
		DataManager.refresh();
		DataManager.alert('Connected to server.');
		if (ts) clearInterval(ts);
	};

	socket.onclose = function(){
		update('connectionStatus',{online:false});
		DataManager.alert('Connection to server lost. Trying to restablish connection with the server.',{type:'danger'});
		ts = setInterval(connect, 1000);
	};

	DataManager.bind(socket);
}

var DataManager = new (function(){

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
		};

	var receive = function(e) {
		// console.log(e.data);
		var d = JSON.parse(e.data);
		var msig = d.msig || null;
		if (msig && __cbqueue[msig]) {
			__cbqueue[msig](d);
			delete __cbqueue[msig];
			return;
		}
		if (d.event == 'log-stream') {
			$('#'+d.target).append(d.body);
		}
	}

	var send = function(method, args, callback){
		var args = args || [];
		msig = (callback) ? (new Date().getTime() * Math.random(1000)).toString(36) : null;
		if (msig) { __cbqueue[msig] = callback }
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
				update('sourceLists',sources);
			}
		});
	};

	this.getExtractorList = function(){
		send('getExtractorList',null,function(e){
			if(!e.err) {
				extractors = e.body;
				update('extractorLists', extractors);
			}
		});
	};

	this.getTransformerList = function(){
		send('getTransformerList',null,function(e){
			if(!e.err) {
				transformers = e.body;
				update('transformerLists', transformers);
			}
		});
	};

	this.getLoaderList = function(){
		send('getLoaderList',null,function(e){
			if(!e.err) {
				loaders = e.body;
				update('loaderLists', loaders);
			}
		});
	};

	this.refresh = function(){
		this.list();
		this.getExtractorList();
		this.getTransformerList();
		this.getLoaderList();
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

	this.ftpBrowse = function()
	{
		var v = $('#ext-source-select').val();
		var s = DataManager.getSources().filter(function(e){
			if (e.id == v) return e;
			else return null;
		}).pop();

		send('browseFTP',[s],function(e){
			if(!e.err && e.body.success === true) {
				$('#ext-ftp-browser .files').empty();
				e.body.list.forEach(function(item, index){
					if (item.name) $('#ext-ftp-browser .files').append($('<li class="file">'+item.name+'</li>').click(function(){
						$('#ftpFileName').val(item.name);
						$('#ext-ftp-browser .files').empty();
						$('#extractionWizardNext').removeAttr("disabled");
					}));
				});
			}
		});
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
			console.log(e);
			cb(e);
		});
	};

	this.loader.save = function(ext){
		send('saveLoader', [ext], function(e){
			console.log(e);
		});
	};

	this.loader.sample = function(ext, cb){
		send('testLoader', [ext], function(e){
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
		$('#validateBtn').attr('disabled','disabled');

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
			src = {	name: $('#sourcename').val() };

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

})();

connect();

if (document.location.hash) DataManager.navigate(document.location.hash.replace('#',''));
else DataManager.navigate('dashboard');

var sourceModalReset = function(){
	$('#validateBtn').removeAttr('disabled').removeClass('btn-danger btn-success').addClass('btn-primary');
	$('#sourceValidationStatus').removeClass('glyphicon-ok-sign glyphicon-exclamation-sign');
	$('#sourceTypeOptions .option-group').hide();
	$('#sourceEditorSave').prop('disabled',true);
};

var resetWizard = function(id){
	$('#'+id+' section.step').hide().first().show();
};

$(document).ready(function(){

	var ext = function(){
		return {
			name: $('#extractorName').val(),
			source: $('#ext-source-select').val(),
			target: {
				type: "file",
				res: $('#ftpRootPath').val() + $('#ftpFileName').val(),
				format: $('[name=ext-text-format]:checked').val()
			}
		};
	};

	var trn = function(){
		var transform = {
			name: $('#transformerName').val(),
			description: $('#transformerDescription').val(),
			style: $('#trn-source-toggle').val(),
			extractor: $('#trn-source-select').val(),
			transform: {
				input: [],
				normalize: [],
				map: $('#trn-map').val()
			}
		};

		$('#transformNormalize .item input:text:enabled').each(function(index,item){
			transform.transform.input.push($('.name', $(item).parent().parent()).text());
			transform.transform.normalize.push({
				in: $('.name', $(item).parent().parent()).text(),
				out: $(item).val()
			});
		});

		return transform;
	};

	var ldr = function(){
		var res = {
			transform: $('#ldr-source-select').val(),
			target: {
				type: $('#ldr-target-type').val(),
				dsn: $('#ldr-mysql-dsn').val(),
				schema: {
					name: $('#ldr-target-schema').val(),
					fields: []
				}
			}
		};
		$('#loaderSchemas .fields .maps label').each(function(index,item){
			res.target.schema.fields.push({
				key: $(item).text(),
				type: $(item).parent().parent().find('select').val()
			});
		});
		console.log(res);
		return res;
	};

	$('.logger').each(function(index, item){
		item.addEventListener("DOMNodeInserted", function(e){
			this.scrollTop = this.scrollHeight;
		});
	});

	$('#sourcetype').change(function(){
		sourceModalReset();
		if ($(this).val() == 'RETS') $('#source_RETS').show();
		else if ($(this).val() == 'FTP') $('#source_FTP').show();
		else if ($(this).val() == 'SOAP') $('#source_SOAP').show();
		else if ($(this).val() == 'REST') $('#source_REST').show();
		else if ($(this).val() == 'XML') $('#source_XML').show();
	}).change();

	resetWizard('extractorWizard');
	resetWizard('transformWizard');
	resetWizard('loaderWizard');
	// $('.wizard section.step').first().show();

	/**
	 * When selecting a data source for an extractor let's do some logic
	 * based on the type of source they've chosen
	 */
	$('#ext-source-select').change(function(){
		var v = $(this).val();
		var s = DataManager.getSources().filter(function(e){
			if (e.id == v) return e;
			else return null;
		}).pop();

		$('#extractorWizard .source-options').hide();
		if (s.value.type === 'FTP') {
			$('#ext-ftp-browser .files').empty();
			$('#ftpRootPath').val('');
			$('#ftpFileName').val('');
			$('#ext-ftp-options').show();
		}
		else if (s.value.type === 'RETS') {
			$('#ext-rets-options').show();
		}
	});

	$('#extractorWizardNext').click(function(){

		var finish = function(){
			$('#extractorWizard').modal('hide');
			DataManager.extractor.validate(ext());
			DataManager.extractor.save(ext());
		}

		if ($('#extractorWizard section.step.active').is($('#extractorWizard section.step').last())) return finish();

		$('#extractorWizard section.step.active').hide().removeClass('active').next().show().addClass('active');
		$('#extractorWizard .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
		if (!$('#extractorWizard section.step.active').is($('#extractorWizard section.step').first())) $('#extractorWizardBack').removeAttr('disabled');
		if ($('#extractorWizard section.step.active').is($('#extractorWizard section.step').last())) $('#extractorWizardNext').text('Finish').removeClass('btn-primary').addClass('btn-success').attr('disabled','disabled');
	});

	$('#extractorWizardBack').click(function(){
		$('#extractorWizard section.step.active').hide().removeClass('active').prev().show().addClass('active');
		$('#extractorWizard .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
		if ($('#extractorWizard section.step.active').is($('#extractorWizard section.step').first())) $('#extractorWizardBack').attr('disabled','disabled');
		if (!$('#extractorWizard section.step.active').is($('#extractorWizard section.step').last())) $('#extractorWizardNext').text('Next').removeClass('btn-success').addClass('btn-primary').removeAttr('disabled');
	});

	$('#ext-unarchive').change(function(){
		if ($('#ext-unarchive')[0].checked) $('#ext-archive-opts').removeAttr('disabled');
		else  $('#ext-archive-opts').attr('disabled','disabled');
	});

	$('#ext-test').click(function(){
		$('#extraction-result').html('');
		DataManager.extractor.sample(ext(),function(e){
			if (!e.err) {
				$('#extraction-result').html('<p class="bg-success">Extractor Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
				$('#extractorWizardNext').removeAttr('disabled');
			} else {
				$('#extractorWizardNext').attr('disabled','disabled');
				$('#extraction-result').html('<p class="bg-danger">Extractor Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
			}
		});
	});

	$('#ext-test-clear').click(function(){
		$('#extraction-log-body').html('');
		$('#extraction-result').html('');
	});

	/**
	 * Transform Wizard
	 */

	$('#transformWizardNext').click(function(){

		var finish = function(){
			$('#transformWizard').modal('hide');
			DataManager.transformer.validate(trn());
			DataManager.transformer.save(trn());
		}

		if ($('#transformWizard section.step.active').is($('#transformWizard section.step').last())) return finish();

		$('#transformWizard section.step.active').hide().removeClass('active').next().show().addClass('active');
		$('#transformWizard .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
		if (!$('#transformWizard section.step.active').is($('#transformWizard section.step').first())) $('#transformWizardBack').removeAttr('disabled');
		if ($('#transformWizard section.step.active').is($('#transformWizard section.step').last())) $('#transformWizardNext').text('Finish').removeClass('btn-primary').addClass('btn-success').attr('disabled','disabled');
	});

	$('#transformWizardBack').click(function(){
		$('#transformWizard section.step.active').hide().removeClass('active').prev().show().addClass('active');
		$('#transformWizard .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
		if ($('#transformWizard section.step.active').is($('#transformWizard section.step').first())) $('#transformWizardBack').attr('disabled','disabled');
		if (!$('#transformWizard section.step.active').is($('#transformWizard section.step').last())) $('#transformWizardNext').text('Next').removeClass('btn-success').addClass('btn-primary').removeAttr('disabled');
	});

	$('#trn-source-toggle').change(function(){
		if ($(this).val() !== 'custom') $('#trn-source-select').removeAttr('disabled');
		else $('#trn-source-select').attr('disabled','disabled');
	});

	$('#trn-source-select').change(function(){
		var v = $(this).val();
		var s = DataManager.getExtractors().filter(function(e){
			if (e.id == v) return e;
			else return null;
		}).pop();

		DataManager.extractor.sample(s.value,function(e){
			if (!e.err) update('dataStructures',e.body);
		});
	});

	$('#transformNormalize').hide();
	$('#transformMapper').hide();
	$('#trn-transform-type').change(function(){
		if ($(this).val() == 'normalize') {
			$('#transformNormalize').show();
			$('#transformMapper').hide();
		}
		if ($(this).val() == 'map') {
			$('#transformNormalize').hide();
			$('#transformMapper').show();
		}
	});

	$('#trn-test').click(function(){
		$('#transformer-result').html('');
		DataManager.transformer.sample(trn(),function(e){
			if (!e.err) {
				$('#transformer-result').html('<p class="bg-success">Transform Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
				$('#transformWizardNext').removeAttr('disabled');
			} else {
				$('#transformer-result').html('<p class="bg-danger">Transform Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
				$('#transformWizardNext').attr('disabled','disabled');
			}
		});
	});

	$('#trn-test-clear').click(function(){
		$('#transformer-log-body').html('');
		$('#transformer-result').html('');
	});

	/**
	 * Loader Wizard
	 */

	$('#loaderWizardNext').click(function(){

		var finish = function(){
			$('#loaderWizard').modal('hide');
			DataManager.loader.validate(ldr());
			DataManager.loader.save(ldr());
		}

		if ($('#loaderWizard section.step.active').is($('#loaderWizard section.step').last())) return finish();

		$('#loaderWizard section.step.active').hide().removeClass('active').next().show().addClass('active');
		$('#loaderWizard .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
		if (!$('#loaderWizard section.step.active').is($('#loaderWizard section.step').first())) $('#loaderWizardBack').removeAttr('disabled');
		if ($('#loaderWizard section.step.active').is($('#loaderWizard section.step').last())) $('#loaderWizardNext').text('Finish').removeClass('btn-primary').addClass('btn-success').attr('disabled','disabled');
	});

	$('#loaderWizardBack').click(function(){
		$('#loaderWizard section.step.active').hide().removeClass('active').prev().show().addClass('active');
		$('#loaderWizard .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
		if ($('#loaderWizard section.step.active').is($('#loaderWizard section.step').first())) $('#loaderWizardBack').attr('disabled','disabled');
		if (!$('#loaderWizard section.step.active').is($('#loaderWizard section.step').last())) $('#loaderWizardNext').text('Next').removeClass('btn-success').addClass('btn-primary').removeAttr('disabled');
	});

	$('#ldr-source-toggle').change(function(){
		if ($(this).val() !== 'custom') $('#ldr-source-select').removeAttr('disabled');
		else $('#ldr-source-select').attr('disabled','disabled');
	});

	var trnSample = {};
	$('#ldr-source-select').change(function(){
		var v = $(this).val();
		var s = DataManager.getTransformers().filter(function(e){
			if (e.id == v) return e;
			else return null;
		}).pop();

		DataManager.transformer.sample(s.value,function(e){
			if (!e.err) {
				update('loaderDefinition',e.body);
				trnSample = e.body;
			} 
		});
	});

	$('#loaderMySQL').hide();
	$('#loaderCouchDB').hide();
	$('#loaderFTP').hide();
	$('#ldr-target-type').change(function(){
		switch($(this).val())
		{
			case "mysql":
				$('#loaderMySQL').show();
				$('#loaderCouchDB').hide();
				$('#loaderFTP').hide();
			break;
			case "couchdb":
				$('#loaderMySQL').hide();
				$('#loaderCouchDB').show();
				$('#loaderFTP').hide();
			break;
			case "ftp":
				$('#loaderMySQL').hide();
				$('#loaderCouchDB').hide();
				$('#loaderFTP').show();
			break;
		}
	});

	$('#loaderDSN button').click(function(){
		DataManager.loader.validateConnection(ldr(),function(e){
			var t = $('#ldr-target-type').val();
			var btn = (t === 'mysql') ? '#ldr-mysql-validate' : '#ldr-couchdb-validate';
			$(btn).removeClass('btn-danger btn-success').addClass('btn-primary');
			if (!e.err) {
				$(btn).removeClass('btn-primary').addClass('btn-success')
				$(btn+' .validation-status').removeClass('glyphicon-asterisk').addClass('glyphicon-ok-sign');
			} else {
				$(btn).removeAttr('disabled').removeClass('btn-primary').addClass('btn-danger')
				$(btn+' .validation-status').removeClass('glyphicon-asterisk').addClass('glyphicon-exclamation-sign');
			}

		});
	});

	$('#ldr-create-schema').click(function(){
		DataManager.loader.createSchema(ldr(),function(e){
			var t = $('#ldr-target-type').val();
			var btn = (t === 'mysql') ? '#ldr-mysql-validate' : '#ldr-couchdb-validate';
			$(btn).removeClass('btn-danger btn-success').addClass('btn-primary');
			if (!e.err) {
				$(btn).removeClass('btn-primary').addClass('btn-success')
				$(btn+' .validation-status').removeClass('glyphicon-asterisk').addClass('glyphicon-ok-sign');
			} else {
				$(btn).removeAttr('disabled').removeClass('btn-primary').addClass('btn-danger')
				$(btn+' .validation-status').removeClass('glyphicon-asterisk').addClass('glyphicon-exclamation-sign');
			}

		});
	});

	$('#loaderSchemas .fields').hide();
	$('#ldr-new-schema').click(function(){
		$('#loaderSchemas .create').hide();
		$('#loaderSchemas .fields').show();
	});

	$('#ldr-test').click(function(){
		$('#loader-result').html('');
		DataManager.loader.sample(ldr(),function(e){
			if (!e.err) {
				$('#loader-result').html('<p class="bg-success">Transform Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
				$('#loaderWizardNext').removeAttr('disabled');
			} else {
				$('#loader-result').html('<p class="bg-danger">Transform Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
				$('#loaderWizardNext').attr('disabled','disabled');
			}
		});
	});

	$('#ldr-test-clear').click(function(){
		$('#loader-log-body').html('');
		$('#loader-result').html('');
	});

});