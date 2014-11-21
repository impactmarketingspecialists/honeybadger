+(function($admin,$){

	// console.log($admin);
	var self = $admin.View = this;
	var private = {}, protected = {};
	var $HB, $DM;

	var _construct = function() {
		console.log('Admin.View constructor');
		$HB = $admin._parent;
		$DM = $HB.DataManager;
	};

	var _init = function() {
		// Our parent already listens for DOM ready
		console.log('Admin.View initialized');

		$HB.on('readyStateChange',self.connection());
		$DM.on('sources',self.sources());
		$DM.on('extractors',self.extractors());
		$DM.on('transformers',self.transformers());
		$DM.on('loaders',self.loaders());
	};

	$admin.module.register({
		name: 'View',
		instance: this
	},function(_unsealed){
		// Initialize module
		$admin = _unsealed(_init); // fire initializer when DOM ready
		_construct(); // run constructor now
	});

	this.connection = function() {
		return function render(readyState) {
			if (readyState === 1) {
				$('#connection').addClass('online').removeClass('offline');
				$('#connection .status').text('Online');
			}
			else {
				$('#connection').addClass('offline').removeClass('online');
				$('#connection .status').text('Offline');
			}
		};
	};
	
	this.sources = function() {
		// Do some preloader stuff here
		return function render(data) {
			$('#activeSources > tbody').html('');
			$('#inactiveSources > tbody').html('');
			$('#sourceList > tbody').html('');
			$('#ext-source-select').html('<option value="">-- Select Source --</option>');
			$(data).each(function(index, item){
				$('#sourceList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>').click(function(){
					$admin.UI.showWizard('sourceEditor');
					$admin.UI.setupWizard('sourceEditor', $DM.getSource(item.id).value);
				}));
				$('#ext-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');
				if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});
		};
	};

	this.extractors = function() {

		return function render(data) {
			$('#extractorList > tbody').html('');
			$('#trn-source-select').html('<option value="">-- Select extractor --</option>');
			$(data).each(function(index, item){
				$('#extractorList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>').click(function(){
					showWizard('extractorWizard');
					setupWizard('extractorWizard', item.value);
				}));
				$('#trn-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');
				// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});
		};
	};

	this.transformers = function() {

		return function render(data) {
			$('#transformerList > tbody').html('');
			$('#ldr-source-select').html('<option value="">-- Select transformer --</option>');
			$(data).each(function(index, item){
				$('#transformerList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>').click(function(){
					showWizard('transformWizard');
					setupWizard('transformWizard', item.value);
				}));
				$('#ldr-source-select').append('<option value="'+item.id+'">'+item.key+'</option>');
				// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});
		};
	};

	this.loaders = function() {

		return function render(data) {
			$('#loaderList > tbody').html('');
			$(data).each(function(index, item){
				$('#loaderList > tbody').append($('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>').click(function(){
					showWizard('loaderWizard');
					setupWizard('loaderWizard', item.value);
				}));
				// if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>');
				// else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+(new Date(item.value.date)).toDateString()+'</td></tr>') ;
			});
		};
	};

	this.transformDataStructures = function() {

		return function render(data) {
			$('#transformNormalize').html('');
			$('#transformMapper .fields').html('');
			if (d.headers) {
				$.each(d.headers,function(index,item){
					$('#transformNormalize').append('<label class="row item"><div class="col-md-6 form-inline"><label><input type="checkbox" checked/><span class="name">'+item+'</span></label></div><div class="col-md-6"><input type="text" class="form-control" value="'+item+'"/></div></label>')
					$('#transformMapper .fields').append('<span class="item badge">'+item+'</span> ');
				});			
			} else if (d.data.data) {
				$.each(d.data.data[0],function(index,item){
					$('#transformNormalize').append('<label class="row item"><div class="col-md-6 form-inline"><label><input type="checkbox" checked/><span class="name">'+index+'</span></label></div><div class="col-md-6"><input type="text" class="form-control" value="'+index+'"/></div></label>')
					$('#transformMapper .fields').append('<span class="item badge">'+index+'</span> ');
				});			
			}

			$('#transformNormalize input:checkbox').change(function(){
				if (!$(this)[0].checked) $(this).parent().parent().parent().find('input[type="text"]').attr('disabled','disabled');
				else $(this).parent().parent().parent().find('[type=text]').removeAttr('disabled');
			})
		};
	};

	this.loaderDefinition = function() {

		return function render(data) {
			$('#loaderSchemas .fields .maps').html('');
			$.each(d.headers,function(index,item){
				if (!item) return;
				$('#loaderSchemas .fields .maps').append('<div class="row form-group"><div class="col-md-6"><label>'+item+'</label></div><div class="col-md-6"><select class="form-control"><option value="string">String</option><option value="float">Float</option><option value="bool">Boolean</option><option value="text">Long Text</option></select></div></div>')
			});
		};
	};

}(HoneyBadger.Admin, jQuery));
