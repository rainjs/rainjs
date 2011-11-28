var child = require('child_process');
var fs = require('fs');

desc('Print the help message');
task('default', function (params) {
	jake.showAllTaskDescriptions();
});

namespace('doc', function () {
	namespace('client', function () {
		desc('Generate the client documentation');
		task('generate', function () {
			console.log('Generating RST documntation');
			var args = [
				'-jar',
				'./tools/jsdoc-toolkit/jsrun.jar',
				'./tools/jsdoc-toolkit/app/run.js',
				'-c=./tools/jsdoc-toolkit/client.conf',
			];
	
			var jsdoc = child.spawn('java', args);

			jsdoc.stdout.on('data', function (data) {
				var buffer = new Buffer(data);
				console.log(buffer.toString());
			});

			jsdoc.stderr.on('data', function (data) {
				console.log('Error: ' + data);
			});
			
			jsdoc.on('exit', function () {
				console.log('Done ...');
			});
		});
	});

	desc('Generate the documentation');
	task('generate', function () {
		var children = [],
            args,
			conf,
			buffer;

		args = [
			'-jar',
			'./tools/jsdoc-toolkit/jsrun.jar',
			'./tools/jsdoc-toolkit/app/run.js',
			'-c=./tools/jsdoc-toolkit/rain.conf'
		];

		buffer = new Buffer(fs.readFileSync('./doc/config.json'));
		conf = JSON.parse(buffer.toString());

        console.log('Generating client RST documntation');

        for (var i in conf.client.files) {
            var file = conf.client.files[i];

            child.spawn('java', Array.prototype.concat.call(args, [
                '-d=' + conf.client.buildPath,
                conf.client.srcPath + '/' + file
            ]));
        }

        console.log('Generating server RST documntation');

        for (var i in conf.server.files) {
            var file = conf.server.files[i];

            child.spawn('java', Array.prototype.concat.call(args, [
                '-d=' + conf.server.buildPath,
                conf.server.srcPath + '/' + file
            ]));
        }
	});
});
