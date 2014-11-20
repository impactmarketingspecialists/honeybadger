/*! honeybadger 2014-11-20 */
var Promise=function(a,b){this.then=function(a,b){return this.next=new Promise(a,b),this.next},this.run=function(){a.promise=this,a.apply(b)},this.complete=function(){this.next&&this.next.run()}};Promise.create=function(a){return a.hasOwnProperty("promise")?a.promise:new Promise};var Emitter=function(a){var b=[];a.on=function(c,d){var e=b.map(function(b){return b.event!==c&&b.context!==a&&b.callback!==d?b:void 0});e.length||b.push({event:c,context:a,callback:d})};var c=function(a,c){for(var d=0;d<b.length;d++)b[d].event===a&&b[d].context&&b[d].callback(c)};return function(b,d){c(b,d,a)}},HoneyBadger=function(){var a,b,c,d="ws://"+location.host+"/admin/",e=Emitter(this),f=this,g={},h={},i=[],j="localhost:8090"==window.location.host||window.location.host.indexOf("192.168")>-1?!0:!1,k=function(){return{DataManager:{},module:{register:function(a,b){void 0!=typeof a.name&&void 0!=typeof a.instance&&(void 0==typeof h[a.name]&&(h[a.name]=a.instance),b&&b(m))}},init:n}},l=function(){var a=k();return a.__devmode=j,a.on=f.on,a.exec=r,a},m=function(a){return i.push(a),l()};console.log("HoneyBadger starting up");var n=function(){console.log("HoneyBadger initializing"),o(),console.log("HoneyBadger initializing submodules");for(var a=0;a<i.length;a++)i[a]();console.log("HoneyBadger initializing complete!")},o=function(){return a&&clearInterval(a),b&&clearInterval(b),c=new WebSocket(d),c.onopen=function(){a&&clearInterval(a),b=setInterval(function(){c.send("ping")},15e3),e("readyStateChange",1)},c.onclose=function(){b&&clearInterval(b),a=setInterval(o,1e3)},c.onmessage=q,c},p=function(a,b,d){var b=b||[],e=d?((new Date).getTime()*Math.random(1e3)).toString(36):null;e&&(g[e]=d),j&&(console.trace(),console.dir({method:a,msig:e,args:b})),c.send(JSON.stringify({method:a,msig:e,args:b}))},q=function(a){if(j&&console.dir(a.data),"pong"!==a.data){var b=JSON.parse(a.data),c=b.msig||null;return c&&g[c]?(g[c](b),void delete g[c]):void("log-stream"==b.event)}},r=function(a,b,c){p(a,b,c)};return k()}(HoneyBadger||{});+function(a){var b=this,c=[],d=[],e=[],f=[],g=function(){console.log("DataManager constructor"),a.on("readyStateChange",function(a){1===a&&b.refresh()})},h=function(){console.log("DataManager initialized")};this.getSourceList=function(b,d){console.log("Requesting sources"),a.exec("list",null,function(a){a.err||(c=a.body),d&&d(a)})},this.getExtractorList=function(){a.exec("getExtractorList",null,function(a){a.err||(d=a.body)})},this.getTransformerList=function(){a.exec("getTransformerList",null,function(a){a.err||(e=a.body)})},this.getLoaderList=function(){a.exec("getLoaderList",null,function(a){a.err||(f=a.body)})},this.refresh=function(){this.getSourceList()},this.getSource=function(a){return DataManager.getSources().filter(function(b){return b.id==a?b:null}).pop()},this.getExtractor=function(a){return DataManager.getExtractors().filter(function(b){return b.id==a?b:null}).pop()},this.getTransformer=function(a){return DataManager.getTransformers().filter(function(b){return b.id==a?b:null}).pop()},this.getLoader=function(a){return DataManager.getLoaders().filter(function(b){return b.id==a?b:null}).pop()},this.getSources=function(){return c},this.getExtractors=function(){return d},this.getTransformers=function(){return e},this.getLoaders=function(){return f},this.source=function(){},this.extractor={},this.extractor.validate=function(){},this.extractor.save=function(b){a.exec("saveExtractor",[b],function(a){console.log(a)})},this.extractor.sample=function(b,c){a.exec("testExtractor",[b],function(a){c(a)})},this.transformer={},this.transformer.validate=function(){},this.transformer.save=function(b){a.exec("saveTransformer",[b],function(a){console.log(a)})},this.transformer.sample=function(b,c){a.exec("testTransformer",[b],function(a){c(a)})},this.loader={},this.loader.validate=function(){},this.loader.validateConnection=function(b,c){a.exec("validateLoaderConnection",[b],function(a){c(a)})},this.loader.createSchema=function(b,c){a.exec("createLoaderSchema",[b],function(a){c(a)})},this.loader.save=function(b){a.exec("saveLoader",[b],function(a){cb(a)})},this.loader.sample=function(b,c){a.exec("testLoader",[b],function(a){c(a)})},a.module.register({name:"DataManager",instance:this},function(b){a=b(h),g()})}(HoneyBadger||{}),+function(a){return a.source=function(){return{create:function(){},read:function(){},update:function(){},"delete":function(){}}},a}(HoneyBadger||{});