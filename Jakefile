var child = require('child_process');
var fs = require('fs');

desc('Print the help message');
task('default', function (params) {
	jake.showAllTaskDescriptions();
});

namespace('doc', function () {
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
            ])).on('data', function (data) {
                    var buffer = new Buffer(data);
                    console.log(buffer.toString());
            });
        }

        console.log('Generating server RST documntation');

        for (var i in conf.server.files) {
            var file = conf.server.files[i];

            child.spawn('java', Array.prototype.concat.call(args, [
                '-d=' + conf.server.buildPath,
                conf.server.srcPath + '/' + file
            ])).on('data', function (data) {
                var buffer = new Buffer(data);
                console.log(buffer.toString());
            });
        }
	});

    desc('Build the client documentation');
    task('build', function () {
        console.log('Building documentation');
        child.exec('make clean', {cwd:'./doc', env:process.env}, function (error, stdout, stderr) {
            console.log(stdout);
        });
        var sphinx = child.spawn('make', ['html'], {cwd:'./doc', env:process.env});
        sphinx.stdout.on('data', function (data) {
            var buffer = new Buffer(data);
            console.log(buffer.toString());
        });
        sphinx.stderr.on('data', function (data) {
            console.log('Error: ' + data);
        });
    });

    desc('Publish the documentation to github!');
    task('publish', function () {
        var files;
        try {
            var stats = fs.statSync('../rain_docs');
        } catch (e) {
            console.log('Rain docs do not exist, cloning');
            var git = child.spawn('git', [
                'clone',
                '-b',
                'gh-pages',
                'git@github.com:rainjs/rainjs.git',
                'rain_docs'
            ], {cwd: '../', env: process.env});
            git.stdout.on('data', function (data) {
                var buffer = new Buffer(data);
                console.log(buffer.toString());
            });
        }

        files = fs.readdirSync('../rain_docs');
        console.log('Cleaning up the public doc directory');
        for (var i in files) {
            var file = files[i];

            if (file == '.git') {
                continue;
            }

            child.exec('rm -rf ../rain_docs/' + file);
        }

        child.exec('cp -rp ./doc/build/html/* ../rain_docs/');
        child.exec('git add .', {cwd:'../rain_docs', env:process.env});
        child.exec('git commit -m "added new version of the documentation', {cwd:'../rain_docs', env:process.env});
        child.exec('git push', {cwd:'../rain_docs', env:process.env});
    });
});
