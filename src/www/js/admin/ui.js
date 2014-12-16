+(function($admin,$){

	var self = $admin.UI = this;
	var private = {}, protected = {}, pages = {};
	var $HB, $DM;

	var _construct = function() {
		console.log('Admin.UI constructor');
		$HB = $admin._parent;
		$DM = $HB.DataManager;
	};

	var _init = function() {
		// Our parent already listens for DOM ready
		
		/**************** UI Bindings ***************/
		/**
		 * This HUGE block handles all of the setup and bindings
		 * For latching onto buttons, initializing the UI, etc.
		 * This is essentially our root DOM ready handler
		 *
		 * If you're wondering, "Where the fuck is the handler
		 * for this stupid button?"; or "How is this UI event
		 * getting handled?" - this is your spot.
		 *
		 * If you're looking for where data is rendered into the
		 * UI, where DOM getting manipulated or updated; look at
		 * view.js
		 */

		pages = {
			dashboard: $('#dashboard').hide(),
			sourceManager: $('#sourceManager').hide(),
			extractorManager: $('#extractorManager').hide(),
			transformManager: $('#transformManager').hide(),
			loaderManager: $('#loaderManager').hide()
		};

		$('[data-toggle="page"]').each(function(index,item){
			$(item).click(function(){
				self.navigate($(this).attr('data-target'));
			});
		});

		/**
		 * Handle keep any log windows down to the bottom
		 */
		$('.logger').each(function(index, item){
			item.addEventListener("DOMNodeInserted", function(e){
				this.scrollTop = this.scrollHeight;
			});
		});

		/**
		 * Detect when source modal is activated 
		 */
		$('#sourceEditor').on('show.bs.modal', function(){
			resetWizard('sourceEditor');
		})

		/**
		 * Detect when extractor modal is activated 
		 */
		$('#extractorWizard').on('show.bs.modal', function(){
			resetWizard('extractorWizard');
		})

		/**
		 * Detect when transformer modal is activated 
		 */
		$('#transformWizard').on('show.bs.modal', function(){
			resetWizard('transformWizard');
		})

		/**
		 * Detect when loader modal is activated 
		 */
		$('#loaderWizard').on('show.bs.modal', function(){
			resetWizard('loaderWizard');
		})

		/**
		 * Reset our wizards
		 */
		resetWizard('extractorWizard');
		resetWizard('transformWizard');
		resetWizard('loaderWizard');
		// $('.wizard section.step').first().show();

		/**
		 * Dialog Wizard navigation
		 * 
		 * This provides a generic mechanism for handling the
		 * prev/next/finish buttons and back & forth navigation
		 * of the Dialog wizards.
		 */
		$('[am-Dialog]').each(function(index,item){
			var _id = $(item).prop('id');
			$('[am-Button~=next]',item).click(function(){
				$('#'+_id+' section.step.active').hide().removeClass('active').next().show().addClass('active');
				$('#'+_id+' .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
				if (!$('#'+_id+' section.step.active').is($('#'+_id+' section.step').first())) $('#'+_id+' [am-Button~=prev]').prop('disabled',false);
				if ($('#'+_id+' section.step.active').is($('#'+_id+' section.step').last())) {
					$('#'+_id+' [am-Button~=next]').hide();
					$('#'+_id+' [am-Button~=finish]').show();
				}
			});

			$('#'+_id+' [am-Button~=prev]').click(function(){
				$('#'+_id+' section.step.active').hide().removeClass('active').prev().show().addClass('active');
				$('#'+_id+' .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
				if ($('#'+_id+' section.step.active').is($('#'+_id+' section.step').first())) $('#'+_id+' [am-Button~=prev]').prop('disabled',true);
				if (!$('#'+_id+' section.step.active').is($('#'+_id+' section.step').last())) {
					$('#'+_id+' [am-Button~=finish]').hide();
					$('#'+_id+' [am-Button~=next]').show();
				}
			});
		});


		/**************** UI Bindings ***************/
		/**************** Sources ***************/

		$('#validateBtn').click(function(){
			Admin.Validator.source.validate();
		});

		$('#sourceEditor [am-Button~=prev]').hide();
		$('#sourceEditor [am-Button~=next]').hide();
		$('#sourceEditor [am-Button~=finish]').click(function(){
			Admin.Validator.source.save();
		});

		/**
		 * From the source Wizard; display source options based on selected source type
		 */
		$('#sourcetype').change(function(){
			sourceModalReset();
			if ($(this).val() == 'RETS') $('#source_RETS').show();
			else if ($(this).val() == 'FTP') $('#source_FTP').show();
			else if ($(this).val() == 'SOAP') $('#source_SOAP').show();
			else if ($(this).val() == 'REST') $('#source_REST').show();
			else if ($(this).val() == 'XML') $('#source_XML').show();
		}).change();

		/**************** UI Bindings ***************/
		/**************** Extractors ***************/

		/**
		 * Setup dialog button to be next vs save
		 */
		$('#extractorWizard [am-Button~=finish]').hide();

		/**
		 * FTP Extractor Browse Button
		 * From the extractor Wizard; if selected source is FTP, bind to the browse button
		 * to find a target from the FTP source
		 */
		$('#ext-ftp-browse').click(function(){
			$DM.ftpBrowse($DM.getSource($('#ext-source-select').val()), function(e){
				if(!e.err && e.body.success === true) {
					$('#ext-ftp-browser .files').empty();
					e.body.list.forEach(function(item, index){
						if (item.name) $('#ext-ftp-browser .files').append($('<li class="file">'+item.name+'</li>').click(function(){
							$('#ftpFileName').val(item.name);
							$('#ext-ftp-browser .files').empty();
							// $('#extractorWizard [am-Button~=prev]').prop("disabled", false);
							$('#extractorWizard [am-Button~=next]').prop("disabled", false);
						}));
					});
				}
			});
		});

		/**
		 * From the extractor wizard:
		 * When selecting a data source for an extractor let's do some logic
		 * based on the type of source they've chosen
		 */
		$('#extractorWizard .source-options').hide();
		$('#ext-source-select').change(function(){
			var s = $DM.getSource($(this).val());

			$('#ext-rets-options .rets-resource').hide();
			$('#ext-rets-options .rets-classification').hide();
			$('#extractorWizard .source-options').hide();

			if (!s) return;
			if (s.value.source.type === 'FTP') {
				$('#ext-ftp-browser .files').empty();
				$('#ftpRootPath').val('');
				$('#ftpFileName').val('');
				$('#ext-ftp-options').show();
				$('#ext-rets-options').hide();
				$('#ext-step-2 > .ext-ftp-options').show();
				$('#ext-step-2 > .ext-rets-options').hide();
			}
			else if (s.value.source.type === 'RETS') {
				$('#ext-ftp-options').hide();
				$('#ext-rets-options').show();
				$('#ext-step-2 > .ext-ftp-options').hide();
				$('#ext-step-2 > .ext-rets-options').show();

				s.value.source.rets = { resource: $('#ext-rets-resource').val() };
				$DM.retsExplore(s.value, function(e){
					if (e.body.meta) {
						$('#ext-rets-resource').html('<option>-- Select a data resource --</option>');
						$.each(e.body.meta.data,function(index,item){
							// console.log(item);
							$('#ext-rets-resource').append('<option value="'+item.ResourceID[0]+'">'+item.VisibleName[0]+'</option>');
							$('#ext-rets-options .rets-resource').removeClass('hide').show();
						});
					}
				});
			}
		});

		/**
		 * From the extractor wizard; for RETS sources, when a user selects a resource
		 */
		$('#ext-rets-resource').change(function(){
			var s = $DM.getSource($('#ext-source-select').val()).value;
			s.source.rets = { resource: $('#ext-rets-resource').val() };
			$DM.retsBrowse(s, function(e){
				if (e.body.meta) {
					$('#ext-rets-class').html('<option>-- Select a data class --</option>')
					$.each(e.body.meta.data,function(index,item){
						// console.log(item);
						$('#ext-rets-class').append('<option value="'+item.ClassName[0]+'">'+item.VisibleName[0] + ((item.StandardName[0]) ? ' : '+item.StandardName[0] : '') +'</option>');
						$('#ext-rets-options .rets-classification').removeClass('hide').show();
					});
				}
			});
		});

		/**
		 * From the extractor wizard; for RETS sources, when a user selects a class
		 */
		$('#ext-rets-class').change(function(){
			var s = $DM.getSource($('#ext-source-select').val()).value;
			s.source.rets = {
				resource: $('#ext-rets-resource').val(),
				classification: $('#ext-rets-class').val()
			};
			$DM.retsInspect(s, function(e){
				$('#ext-step-2 > .ext-rets-options .fields').html('');
				$.each(e.body.meta.data, function(index,item){
					// console.log(item);
					$('#ext-step-2 > .ext-rets-options .fields').append('<div class="item"><strong>'+item.LongName[0]+'</strong> <em>'+index+'</em> <small>'+item.StandardName[0]+'</small> '+((item.Searchable[0] == '1') ? '<span class="badge">Searchable</span>' : '')+'<div class="detail"><small><em>'+item.DataType[0]+'</em> </small></div></div>');
					// +item.ShortName[0]+' '+item.DBName[0]+' '
				});
				$('#extractorWizard [am-Button~=next]').prop("disabled",false);
			});
		});

		/**
		 * From the extractor wizard: bindings for unarchive options
		 */
		$('#ext-unarchive').change(function(){
			if ($('#ext-unarchive')[0].checked) $('#ext-archive-opts').prop('disabled',false);
			else  $('#ext-archive-opts').prop('disabled',true);
		});

		/**
		 * From the extractor wizard: Run the extractor test
		 */
		$('#ext-test').click(function(){
			$('#extraction-result').html('');
			$DM.extractor.sample(ext(),function(e){
				// console.log(e);
				if (!e.err) {
					$('#extraction-result').html('<p class="bg-success">Extractor Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
					$('#extractorWizard [am-Button~=finish]').prop('disabled',false);
				} else {
					$('#extractorWizard [am-Button~=finish]').prop('disabled',true);
					$('#extraction-result').html('<p class="bg-danger">Extractor Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
				}
			});
		});

		/**
		 * Clear the log window
		 */
		$('#ext-test-clear').click(function(){
			$('#extractor-log-body').html('');
			$('#extraction-result').html('');
		});

		/**
		 * Hook to the Dialog finish button
		 */
		$('#extractorWizard [am-Button~=finish]').click(function(){
			$('#extractorWizard').modal('hide');
			$DM.extractor.validate(ext());
			$DM.extractor.save(ext(),function() { $DM.loadExtractors(); });
		});



		/**************** UI Bindings ***************/
		/**************** Transformer ***************/


		/**
		 * Setup dialog button to be next vs save
		 */
		$('#transformWizard [am-Button~=finish]').hide();

		/**
		 * Input type selection for the transformer
		 * This should pretty much just be "bind to extractor" now
		 */
		$('#trn-source-toggle').change(function(){
			if ($(this).val() !== 'custom') $('#trn-source-select').prop('disabled',false);
			else $('#trn-source-select').attr('disabled','disabled');
		});

		/**
		 * When a user selects an extractor to feed into the transformer let's load
		 * some metadata
		 */
		$('#trn-source-select').change(function(){
			var v = $(this).val();
			var s = $DM.getExtractors().filter(function(e){
				if (e.id == v) return e;
				else return null;
			}).pop();
			if (!s) return;
			console.log(s);
			$DM.extractor.sample(s.value,function(e){
				if (!e.err) {
					Admin.View.transformDataStructures()(e.body);
					$('#transformWizard [am-Button~=next]').prop('disabled',false);
				}
			});
		});

		$('#transformNormalize').hide();
		$('#transformMapper').hide();

		/**
		 * When you choose a transformation type
		 */
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

		/**
		 * Bind to the transformer test button
		 */
		$('#trn-test').click(function(){
			$('#transformer-result').html('');
			$DM.transformer.sample(trn(),function(e){
				if (!e.err) {
					$('#transformer-result').html('<p class="bg-success">Transform Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
					$('#transformWizard [am-Button~=finish]').prop('disabled',false);
				} else {
					$('#transformer-result').html('<p class="bg-danger">Transform Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
					$('#transformWizard [am-Button~=finish]').prop('disabled',true);
				}
			});
		});

		/**
		 * Reset tranform test log
		 */
		$('#trn-test-clear').click(function(){
			$('#transformer-log-body').html('');
			$('#transformer-result').html('');
		});

		/**
		 * Hook to the Dialog finish button
		 */
		$('#transformWizard [am-Button~=finish]').click(function(){
			$('#transformWizard').modal('hide');
			$DM.transformer.validate(trn());
			$DM.transformer.save(trn(),function() { $DM.loadTransformers(); });
		});


		/**************** UI Bindings ***************/
		/****************  Loaders  ***************/


		/**
		 * Setup dialog button to be next vs save
		 */
		$('#loaderWizard [am-Button~=finish]').hide();

		/**
		 * When choosing a transformer to feed the loader
		 */
		$('#ldr-source-toggle').change(function(){
			if ($(this).val() !== 'custom') $('#ldr-source-select').removeAttr('disabled');
			else $('#ldr-source-select').attr('disabled','disabled');
		});

		var trnSample = {};

		/**
		 * When choosing a transformer to feed the loader
		 */
		$('#ldr-source-select').change(function(){
			var v = $(this).val();
			var s = $DM.getTransformers().filter(function(e){
				if (e.id == v) return e;
				else return null;
			}).pop();

			$DM.transformer.sample(s.value,function(e){
				if (!e.err) {
					Admin.View.loaderDefinition()(e.body);
					// update('loaderDefinition',e.body);
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

		/**
		 * Bindings to validate the loader DSN, URI, whatever
		 */
		$('#loaderDSN button').click(function(){
			$DM.loader.validateConnection(ldr(),function(e){
				var t = $('#ldr-target-type').val();
				var btn = (t === 'mysql') ? '#ldr-mysql-validate' : '#ldr-couchdb-validate';
				$(btn).removeClass('btn-danger btn-success').addClass('btn-primary');
				if (!e.err) {
					$(btn).removeClass('btn-primary').addClass('btn-success')
					$(btn+' .validation-status').removeClass('glyphicon-asterisk').addClass('glyphicon-ok-sign');
					$('#loaderWizard [am-Button~=next]').prop('disabled',false);
				} else {
					$(btn).prop('disabled',false).removeClass('btn-primary').addClass('btn-danger')
					$(btn+' .validation-status').removeClass('glyphicon-asterisk').addClass('glyphicon-exclamation-sign');
				}

			});
		});

		/**
		 * Bindings to the create schema button for MySQL loaders
		 */
		$('#ldr-create-schema').click(function(){
			$DM.loader.createSchema(ldr(),function(e){
				$('#ldr-create-schema').removeClass('btn-danger btn-success').addClass('btn-primary');
				if (!e.err) {
					$('#ldr-create-schema').removeClass('btn-primary').addClass('btn-success')
					$('#ldr-create-schema .schema-status').removeClass('glyphicon-asterisk').addClass('glyphicon-ok-sign');
				} else {
					$('#ldr-create-schema').prop('disabled',false).removeClass('btn-primary').addClass('btn-danger')
					$('#ldr-create-schema .schema-status').removeClass('glyphicon-asterisk').addClass('glyphicon-exclamation-sign');
				}

			});
		});

		$('#loaderSchemas .fields').hide();
		$('#ldr-new-schema').click(function(){
			$('#loaderSchemas .create').hide();
			$('#loaderSchemas .fields').show();
		});

		/**
		 * Binding for running loader tests
		 */
		$('#ldr-test').click(function(){
			$('#loader-result').html('');
			$DM.loader.sample(ldr(),function(e){
				if (!e.err) {
					$('#loader-result').html('<p class="bg-success">Loader Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
					$('#loaderWizard [am-Button~=finish]').prop('disabled',false);
				} else {
					$('#loader-result').html('<p class="bg-danger">Loader Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
					$('#loaderWizard [am-Button~=finish]').prop('disabled',true);
				}
			});
		});

		/**
		 * Clear the loader test log
		 */
		$('#ldr-test-clear').click(function(){
			$('#loader-log-body').html('');
			$('#loader-result').html('');
		});

		/**
		 * Hook to the Dialog finish button
		 */
		$('#loaderWizard [am-Button~=finish]').click(function(){
			$('#loaderWizard').modal('hide');
			$DM.loader.validate(ldr());
			$DM.loader.save(ldr());
		});


		/**
		 * Finish by navigating to a page
		 */

		if (document.location.hash) self.navigate(document.location.hash.replace('#',''));
		else self.navigate('dashboard');

		console.log('Admin.UI initialized');
	};

	$admin.module.register({
		name: 'UI',
		instance: this
	},function(_unsealed){
		// Initialize module
		$admin = _unsealed(_init); // fire constructor when DOM ready
		_construct();
	});

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

	/**
	 * Reset the UI - All of it if you dare
	 * 
	 * @return {[type]} [description]
	 */
	this.reset = function() {

	};

	this.navigate = function(page, callback){
		if (typeof pages[page] == 'undefined') return false;

		$('#bs-example-navbar-collapse-1 li.active').removeClass('active');
		$('[data-target="'+page+'"]').closest('.nav-item').addClass('active');
		$('#bodyContent > *').hide();
		pages[page].show();
	};

	/**
	 * Modal resets
	 */
	this.sourceModalReset = function(){
		$('#validateBtn').removeAttr('disabled').removeClass('btn-danger btn-success').addClass('btn-primary');
		$('#sourceValidationStatus').removeClass('glyphicon-ok-sign glyphicon-exclamation-sign');
		$('#sourceTypeOptions .option-group').hide();
		$('#sourceEditorSave').prop('disabled',false);
	};

	this.resetWizard = function(id){
		$('#'+id).attr({'data-id':'','data-rev':''});
		$('#'+id+' section.step').hide().first().show();
		$('#'+id+' .files').empty();
		$('input[type=text], input[type=password], select, textarea','#'+id).val('');

		/**
		 * Reset the modal buttons
		 */
		$('#'+id+' section.step').hide().removeClass('active').first().show().addClass('active');
		$('#'+id+' [am-Button~=prev]').show().prop('disabled',true);
		$('#'+id+' [am-Button~=next]').show().prop('disabled',false);
		$('#'+id+' [am-Button~=finish]').prop('disabled',true).hide();

		$('#'+id+' .body.logger').html('');
		$('#'+id+' .wizard-result').html('');
	};

	/**
	 * Populate the proper wizard with saved data
	 * @param  {[type]} id
	 * @param  {[type]} data
	 * @return {[type]}
	 */
	this.setupWizard = function(id, data){
		// ONLY EXECUTES ON EDIT NOT "NEW"
		// console.log(data);
		resetWizard(id);
		switch(id)
		{
			case "sourceEditor":
				sourceModalReset();

				$('#sourceEditor').attr('data-id',data._id);
				$('#sourceEditor').attr('data-rev',data._rev);

				$('#sourcename').val(data.name);
				$('#sourcetype').val(data.source.type);
				if (data.source.type == 'RETS') {
					$('#sourceuri').val(data.source.uri);
					$('#sourceuser').val(data.source.auth.username);
					$('#sourcepassword').val(data.source.auth.password);
					$('#sourceua').val(data.source.auth.userAgentHeader);
					$('#sourceuapw').val(data.source.auth.userAgentPassword);
					$('#source_RETS').show();
				} else if (data.source.type == 'FTP') {
					$('#ftphost').val(data.source.uri);
					$('#ftpuser').val(data.source.auth.username);
					$('#ftpauth').val(data.source.auth.password);
					$('#source_FTP').show();
				}
				else if (data.source.type == 'SOAP') $('#source_SOAP').show();
				else if (data.source.type == 'REST') $('#source_REST').show();
				else if (data.source.type == 'XML') $('#source_XML').show();	
			break;
			case "extractorWizard":

				$('#extractorWizard').attr('data-id',data._id);
				$('#extractorWizard').attr('data-rev',data._rev);
				/**
				 * Load Saved Extractor for Editing
				 */
				
				/**
				 * Populate the first page of the extractor dialog
				 */
				$('#extractorName').val(data.name);
				$('#ext-source-select').val(data.source);
				$('#ext-source-select').val(data.source);
				$('[name=ext-data-format]').val(data.target.format);

				/**
				 * Setup the wizard based on the source type
				 */
				var type = $DM.getSource(data.source).value.source.type;
				$('#extractorWizard .source-options').hide();
				if (type === 'FTP') {

					$('#ftpFileName').val(data.target.res);
					$('#ext-ftp-browser .files').empty();
					$('#ext-ftp-options').show();
					$('.ext-ftp-options').show();
					$('.ext-rets-options').hide();
					$('#ext-rets-options').hide();

					
					if (data.target.format === 'delimited-text') {
						$('#extractorWizard [name=ext-unarchive][value='+data.target.options.unarchive+']').prop('checked',true);
						$('#extractorWizard [name=ext-csv-delimiter][value='+data.target.options.delimiter+']').prop('checked',true);
						$('#extractorWizard [name=ext-csv-escape][value='+data.target.options.escape+']').prop('checked',true);
					}
				}
				else if (type === 'RETS') {
					$('#ext-ftp-options').hide();
					$('.ext-ftp-options').hide();
					$('.ext-rets-options').show();
					$('#ext-rets-options').show();

					$('#extractorWizard .rets-resource').removeClass('hide').show();
					$('#extractorWizard .rets-classification').removeClass('hide').show();
					// $('#ext-rets-resource')

					$('#ext-rets-query').val(data.target.res);					
					$DM.retsExplore( { source: { rets: { resource: data.target.res } } }, function(e){
						if (e.body.meta) {
							$('#ext-rets-resource').html('<option>-- Select a data resource --</option>');
							$.each(e.body.meta.data,function(index,item){
								// console.log(item);
								$('#ext-rets-resource').append('<option value="'+item.ResourceID[0]+'">'+item.VisibleName[0]+'</option>');
								$('#ext-rets-options .rets-resource').removeClass('hide').show();
							});
						}
					});
				}
			break;
			case "transformWizard":
				$('#transformerName').val(data.name);
				$('#transformerDescription').val(data.description);
				$('#trn-source-toggle').val(data.style);
				$('#trn-source-select').val(data.extractor).removeAttr('disabled');
				$DM.extractor.sample($DM.getExtractor(data.extractor).value,function(e){
					if (!e.err) Admin.View.transformDataStructures()(e.body);
				});
			break;
			case "loaderWizard":
				$('#loaderName').val(data.name);
				$('#ldr-source-select').val(data.transform);
				$('#ldr-target-type').val(data.target.type);
				$('#ldr-mysql-dsn').val(data.target.dsn);
				$('#ldr-target-schema').val(data.target.schema.name);

				$DM.transformer.sample($DM.getTransformer(data.transform).value,function(e){
					if (!e.err) {
						Admin.View.loaderDefinition()(e.body);
						// update('loaderDefinition',e.body);
						trnSample = e.body;
					} 
				});

				switch(data.target.type)
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
			break;
		}
	}

	this.showWizard = function(id) {
		$('#'+id).modal('show');
	}

	/**
	 * Get an extractor definition from the UI
	 * @return {[type]}
	 */
	var ext = function(){
		var stype = $DM.getSource($('#ext-source-select').val()).value.source.type;

		var id = $('#extractorWizard').attr('data-id');
		var _rev = $('#extractorWizard').attr('data-rev');

		var extractor = {
			name: $('#extractorName').val(),
			source: $('#ext-source-select').val(),
			target: {
				type: (stype == 'RETS') ? $('#ext-rets-resource').val() : "file",
				class: (stype == 'RETS') ? $('#ext-rets-class').val() : "",
				res: (stype == 'RETS') ? $('#ext-rets-query').val() : ($('#ftpRootPath').val() + $('#ftpFileName').val()),
				format: (stype == 'RETS') ? 'DMQL2' : $('[name=ext-data-format]').val()
			}
		};

		if (id && _rev) {
			extractor._id = id;
			extractor._rev = _rev;
		}

		switch(stype){
			case "FTP":
				if (extractor.target.format === 'delimited-text') {
					extractor.target.options = {
						unarchive: $('[name=ext-unarchive]:checked').val(),
						delimiter: $('[name=ext-csv-delimiter]:checked').val(),
						escape: $('[name=ext-csv-escape]:checked').val()
					};
				}
			break;
			case "RETS":
			break;
		}

		return extractor;
	};

	/**
	 * Get an transformer definition from the UI
	 * @return {[type]}
	 */
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

	/**
	 * Get a loader definition from the UI
	 * @return {[type]}
	 */
	var ldr = function(){
		var res = {
			name: $('#loaderName').val(),
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


}(HoneyBadger.Admin, jQuery));
