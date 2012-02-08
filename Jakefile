// add the components folder to require.paths
// TODO: move this to NODE_PATH when we switch to node 0.6
require.paths.push(process.cwd() + '/components');


var child = require('child_process');
var fs = require('fs');
var daemon = require('daemon');


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
        var targets = '';
        var cmd = '';

		buffer = new Buffer(fs.readFileSync('./doc/config.json'));
		conf = JSON.parse(buffer.toString());

        console.log('Generating client RST documentation');

        for (var i in conf.client.files) {
            var file = conf.client.files[i];
            cmd = 'java ' + Array.prototype.concat.call(args, [
                '-d=' + conf.client.buildPath,
                conf.client.srcPath + file + ' '
            ]).join(' ');

            child.exec(cmd, function (error, stdout, stderr) {
                console.log(stdout);
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
});

namespace('test', function () {
    namespace('server', function () {
        desc('Start the JS test driver server');
        task('start', function () {
            console.log('Starting JSTD Server');
            daemon.daemonize('jstd.log', '/tmp/jstd.pid', function () {
                var jstdPath = './tests/client/bin/JsTestDriver-1.3.3d.jar';
                var jstdPort = 9876;
                //var cmd = 'java -jar ' + jstdPath + ' --port ' + jstdPort + ' --runnerMode DEBUG';
                var args = [
                    '-jar',
                    jstdPath,
                    '--port',
                    jstdPort,
                    '--runnerMode',
                    'DEBUG'
                ];

                var jstd = child.spawn('java', args, {cwd: process.cwd(), env: process.env, setsid: false});
                console.log(jstd.pid);


                try {
                    fs.writeFileSync('/tmp/jstd_server.pid', jstd.pid + '');
                } catch (e) {
                    // for some strange reason we can't write to pid
                }

                jstd.on('exit', function () {
                    try {
                        fs.unlinkSync('/tmp/jstd_server.pid');
                    } catch (e) {
                        // can't
                    }
                });
            });
            console.log('Server started. Now capture your browser by going to http://localhost:9876');
        });

        desc('Stop the JS test driver server');
        task('stop', function () {
            console.log('Stopping JSTD server');
            var pid = fs.readFileSync('/tmp/jstd.pid');
            var jstd = fs.readFileSync('/tmp/jstd_server.pid');
            try {
                process.kill(pid, 'SIGKILL');
                process.kill(jstd, 'SIGTERM');
            } catch (e) {
                console.log('Couldn\'t kill JSTD server');
            }
        });
    });

    namespace('run', function () {
        desc('Run client tests');
        task('client', function () {
            var jstdPath = './tests/client/bin/JsTestDriver-1.3.3d.jar';

            console.log('Running client side tests...');
            var cmd = 'java -jar ' + jstdPath + ' --reset --tests all --config tests/client/conf/ClientTests.jstd --verbose --testOutput ./tests/client/reports';
            child.exec(cmd, function (error, stdout, stderr) {
                console.log(stdout);
            });
        });

        desc('Run server tests');
        task('server', function () {
            var jasmine;
            try {
                jasmine = require('jasmine-node/lib/jasmine-node/index');
            } catch (e) {
                console.log('You do not have jasmine-node installed, please run "npm install -d"');
                return;
            }

            var specFolder = process.cwd() + '/tests/server/tests/';
            var sys = require('sys');

            for (var key in jasmine) {
                global[key] = jasmine[key];
            }

            var isVerbose = true;
            var showColors = true;
            var teamcity = process.env.TEAMCITY_PROJECT_NAME || false;
            var extentions = "js";
            var match = '.'

            var junitreport = {
                report: true,
                savePath : "./tests/server/reports/",
                useDotNotation: true,
                consolidate: true
            }
            var useRequireJs = false;

            console.log('Running server side tests...');

            jasmine.loadHelpersInFolder(specFolder, new RegExp("[-_]helper\\.(" + extentions + ")$"));
            jasmine.executeSpecsInFolder(specFolder, function(runner, log) {
                sys.print('\n');
                    if (runner.results().failedCount == 0) {
                    exitCode = 0;
                } else {
                    exitCode = 1;
                }
            }, isVerbose, showColors, teamcity, useRequireJs, new RegExp(match + "spec\\.(" + extentions + ")$", 'i'), junitreport);
        });

        desc('Run all tests');
        task('all', function () {
            jake.Task['test:run:server'].invoke();
            jake.Task['test:run:client'].invoke();
        });
    });
});
