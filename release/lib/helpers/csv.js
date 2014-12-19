var libftp = require('ftp');

Object.defineProperties(module.exports,{
	parse: {
		value: function(delimiter, quotes, data, callback){
            var libcsv = require('csv-parse');
            var errors = fired = false;
            var headers = null;
            var parser = libcsv({delimiter:delimiter, quote: quotes, columns: function(head){
                if (head.length <= 1) {
                    errors = true;
                    fired = true;
                    callback('headers',null);
                } else {
                    headers = head;
                    // Let's fire our headers callback immediately
                    fired = true;
                    callback(null,{headers:headers})
                }
            }});

            parser.on('finish',function(){
                process.nextTick(function(){
                    // Don't fire if we've already done so
                    console.log('Parse finished')
                    if (!errors && !fired) callback(null,{headers:headers});
                });
            });

            parser.on('error',function(err){
                process.nextTick(function(){
                    // Don't fire if we've already done so
                    console.log(err);
                    if (!fired) callback(err,null);
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
                return data.pipe(parser);
            } else if (typeof data.data !== 'undefined') {
                parser.write(data.data);
                parser.end();
                return parser;
            }
		},
		enumerable: true
	}
});
