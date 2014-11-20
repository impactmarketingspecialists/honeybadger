/*! honeybadger 2014-11-20 */
var HoneyBadger=function(){function a(){return b&&clearInterval(b),c&&clearInterval(c),d=new WebSocket(e),d.onopen=function(){b&&clearInterval(b),c=setInterval(function(){d.send("ping")},15e3)},d.onclose=function(){c&&clearInterval(c),b=setInterval(a,1e3)},d}var b,c,d,e="ws://"+location.host+"/admin/",f={},g={},h=[],i="localhost:8090"==window.location.host?!0:!1,j=function(a,b,c){var b=b||[];msig=c?((new Date).getTime()*Math.random(1e3)).toString(36):null,msig&&(f[msig]=c),i&&(console.trace(),console.dir({method:a,msig:msig,args:b})),d.send(JSON.stringify({method:a,msig:msig,args:b}))},k=function(a,b,c){j(a,b,c)},l=function(a){console.log(a)},m=function(){var a=o();return a.exec=k,a.pm=l,a},n=function(a){return h.push(a),m()},o=function(){return{DataManager:{},module:{register:function(a,b){void 0!=typeof a.name&&void 0!=typeof a.instance&&(void 0==typeof g[a.name]&&(g[a.name]=a.instance),b&&b(n))}},init:function(){a();for(var b=0;b<h.length;b++)h[b]()}}};return o()}(HoneyBadger||{});+function(a){var b=[],c=[],d=[],e=[],f=function(){console.log("DataManager constructor"),a.pm("a message from the DataManager module")},g=function(){console.log("DataManager DOM READY")};this.list=function(b,c){a.exec("list",null,c)},this.getExtractorList=function(){a.exec("getExtractorList",null,function(a){a.err||(c=a.body)})},this.getTransformerList=function(){a.exec("getTransformerList",null,function(a){a.err||(d=a.body)})},this.getLoaderList=function(){a.exec("getLoaderList",null,function(a){a.err||(e=a.body)})},this.refresh=function(){this.list(),this.getExtractorList(),this.getTransformerList(),this.getLoaderList()},this.getSource=function(a){return DataManager.getSources().filter(function(b){return b.id==a?b:null}).pop()},this.getExtractor=function(a){return DataManager.getExtractors().filter(function(b){return b.id==a?b:null}).pop()},this.getTransformer=function(a){return DataManager.getTransformers().filter(function(b){return b.id==a?b:null}).pop()},this.getLoader=function(a){return DataManager.getLoaders().filter(function(b){return b.id==a?b:null}).pop()},this.getSources=function(){return b},this.getExtractors=function(){return c},this.getTransformers=function(){return d},this.getLoaders=function(){return e},this.source=function(){},this.extractor={},this.extractor.validate=function(){},this.extractor.save=function(b){a.exec("saveExtractor",[b],function(a){console.log(a)})},this.extractor.sample=function(b,c){a.exec("testExtractor",[b],function(a){c(a)})},this.transformer={},this.transformer.validate=function(){},this.transformer.save=function(b){a.exec("saveTransformer",[b],function(a){console.log(a)})},this.transformer.sample=function(b,c){a.exec("testTransformer",[b],function(a){c(a)})},this.loader={},this.loader.validate=function(){},this.loader.validateConnection=function(b,c){a.exec("validateLoaderConnection",[b],function(a){c(a)})},this.loader.createSchema=function(b,c){a.exec("createLoaderSchema",[b],function(a){c(a)})},this.loader.save=function(b){a.exec("saveLoader",[b],function(a){cb(a)})},this.loader.sample=function(b,c){a.exec("testLoader",[b],function(a){c(a)})},a.module.register({name:"DataManager",instance:this},function(b){a=b(g),f()})}(HoneyBadger||{}),+function(a){return a.source=function(){return{create:function(){},read:function(){},update:function(){},"delete":function(){}}},a}(HoneyBadger||{});var Promise=function(a,b){this.then=function(a,b){return this.next=new Promise(a,b),this.next},this.run=function(){a.promise=this,a.apply(b)},this.complete=function(){this.next&&this.next.run()}};Promise.create=function(a){return a.hasOwnProperty("promise")?a.promise:new Promise};var Emitter=function(a){var b=[];a.on=function(c,d){var e=b.map(function(b){return b.event!==c&&b.context!==a&&b.callback!==d?b:void 0});e.length||b.push({event:c,context:a,callback:d})};var c=function(a,c){for(var d=0;d<b.length;d++)b[d].event===a&&b[d].context&&b[d].callback(c)};return function(b,d){c(b,d,a)}};