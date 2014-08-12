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
		// $('#activeSources > tbody').html('');
		// $('#inactiveSources > tbody').html('');
		$('#extractorList > tbody').html('');
		$(d).each(function(index, item){
			$('#extractorList > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>');
			// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
			// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
		});
	};

	var transformerLists = function(d) {
		// $('#activeSources > tbody').html('');
		// $('#inactiveSources > tbody').html('');
		$('#transformerList > tbody').html('');
		$(d).each(function(index, item){
			$('#transformerList > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>');
			// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
			// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
		});
	};

	var loaderLists = function(d) {
		// $('#activeSources > tbody').html('');
		// $('#inactiveSources > tbody').html('');
		$('#laoderList > tbody').html('');
		$(d).each(function(index, item){
			$('#loaderList > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>');
			// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
			// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
		});
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

	this.transformer.save = function(ext){
		send('saveTransformer', [ext], function(e){
			console.log(e);
		});
	};

	this.transformer.sample = function(ext, cb){
		send('testTransformer', [ext], function(e){
			cb(e);
		});
	};

	this.loader = {};
	this.loader.validate = function(){

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
		return {};
	};

	$('#sourcetype').change(function(){
		sourceModalReset();
		if ($(this).val() == 'RETS') $('#source_RETS').show();
		else if ($(this).val() == 'FTP') $('#source_FTP').show();
		else if ($(this).val() == 'SOAP') $('#source_SOAP').show();
		else if ($(this).val() == 'REST') $('#source_REST').show();
		else if ($(this).val() == 'XML') $('#source_XML').show();
	}).change();

	resetWizard('extractorWizard');
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

	$('#transformWizardNext').click(function(){

		var finish = function(){
			$('#transformWizard').modal('hide');
			DataManager.transformer.validate(ext());
			DataManager.transformer.save(ext());
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


})
