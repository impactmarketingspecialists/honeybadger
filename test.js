	var mysql = require('mariasql');
	var spawn = require('child_process').spawn;
	var fs = require('fs');
	var stream = require('stream');

	var connection = new mysql();
	connection.connect({
		host: '192.168.6.230',
		user: 'honeybadger',
		password: 'data',
		db: 'honeybadger'
	});

	connection.on('connect', function(err){
	});

	connection.on('error', function(err){
		console.trace(err);
	});

	var query = "INSERT INTO test_table VALUES (1, 'hello', 3.141)";

	var i = 0;
	var size = 500000;

	var out = fs.openSync('/tmp/out.log', 'a');
	var err = fs.openSync('/tmp/out.log', 'a');
	// var in = fs.openSync('/tmp/in.log', 'r');

	var stream = new stream.Transform();
	stream._flush = function (callback){
		return callback();
	}
	stream._write = function(chunk, encoding, callback){
		this.push(chunk);
		return callback();
	};

	var child = spawn("mysql",[
		"-h192.168.6.230",
		"-uhoneybadger",
		"--password=data",
		"honeybadger"
		],{
		detached: true,
		stdio: ['pipe', out, err]
	});
	// child.unref();
	// child.stdout.pipe(process.stdout);
	child.stdin.pipe(stream);
	while (i<size) {

		// connection.query(query)
		// var child = spawn("mysql",[
		// 	"-h192.168.6.230",
		// 	"-uhoneybadger",
		// 	"--password=data",
		// 	"-e INSERT INTO test_table VALUES(1, 'hello', 3.141)",
		// 	"honeybadger"
		// 	],{
		// 	detached: false,
		// 	stdio: [in, out, err]
		// });
		stream.write("INSERT INTO test_table VALUES(1, 'hello', 3.141)\n");

		i++;
		// if ((i % 100) == 1) console.log('Processed record', i);
	}