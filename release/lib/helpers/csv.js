var libftp = require('ftp');

Object.defineProperties(module.exports,{
	parse: {
		value: function(delimiter, quotes, stream, callback){
            var libcsv = require('csv-parse');
            var errors = false;
            var headers = null;
            var parser = libcsv({delimiter:delimiter, quote: quotes, columns: function(head){
                if (head.length <= 1) {
                    errors = true;
                    process.nextTick(function(){
                        callback('headers',null);
                    });
                } else {
                    headers = head;
                }
            }});

            parser.on('finish',function(){
                process.nextTick(function(){
                    if (!errors) callback(null,{headers:headers});
                })
            });

            parser.on('error',function(err){
                process.nextTick(function(){
                    callback(err,null);
                })
            });

            stream.pipe(parser);
		},
		enumerable: true
	}
});
