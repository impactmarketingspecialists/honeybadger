var libftp = require('ftp');

Object.defineProperties(module.exports,{
	parse: {
		value: function(delimiter, quotes, data, callback){
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
                });
            });

            parser.on('error',function(err){
                process.nextTick(function(){
                    callback(err,null);
                });
            });

            /**
             * Let's see if data has a pipe() method.
             *
             * I'm using this as a dirty method to see if data
             * is a stream. We like streams :) we'll return it so
             * it's chainable.
             */
            if (typeof data.pipe === 'function') {
                data.pipe(parser);
                return data;
            } else if (typeof data.data !== 'undefined') {
                parser.write(data.data);
                parser.end();
            }
		},
		enumerable: true
	}
});
