"use strict";

var child = require('child_process');
var fs = require('fs');
var path = require('path');
var util = require('util');

desc('Print the help message');
task('default', function (params) {
    jake.showAllTaskDescriptions();
});

namespace('doc', function () {
    desc('Generate the documentation.');
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

        console.log('Generating RST documentation');

        for (var key in conf) {
            var buildPath = conf[key].buildPath;
            var pages = conf[key].pages;
            console.log('\nGenerating %s documentation.', [key]);

            var files = [];
            for (var i = 0, len = pages.length; i < len; i++) {
                var page = pages[i];
                if (typeof page === 'string') {
                    var pagePath = path.resolve(page);
                    try {
                        var stat = fs.statSync(pagePath);
                        if (stat.isDirectory()) {
                            util.walkSync(pagePath, ['.js'], function (file) {
                                files.push(file);
                            });
                        } else {
                            files.push(pagePath);
                        }
                    } catch (e) {
                        console.log('Invalid documentation file path: %s.', [pagePath]);
                    }
                }
            }

            var generateRST = function(files, buildPath){
                if(files.length > 0){
                    cmd = 'java ' + Array.prototype.concat.call(args, [
                       '-d=' + buildPath, files[0]
                    ]).join(' ');
                    child.exec(cmd, function (error, stdout, stderr) {
                        if (stdout && stdout.replace(/\s+/g, '')) {
                            console.log(stdout);
                        }
                        files.splice(0, 1);
                        generateRST(files, buildPath);
                    });
                }
            };

            var prepareGenerateRST = function(buildPath, files){
                child.exec("rm -rf "+path.resolve(buildPath), function (error, stdout, stderr) {
                    generateRST(files, buildPath);
                });
            }

            prepareGenerateRST(buildPath, files);
        }
    });

    desc('Build the client documentation.');
    task('build', function () {
        console.log('Building documentation.');
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
        desc('Start the JS test driver server.');
        task('start', function () {
            console.log('Starting JSTD Server.');
            daemon.daemonize('jstd.log', '/tmp/jstd.pid', function () {
                var jstdPath = './tests/client/bin/JsTestDriver-1.3.3d.jar';
                var jstdPort = 9876;
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
                    // For some strange reason we can't write to pid.
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

        desc('Stop the JS test driver server.');
        task('stop', function () {
            console.log('Stopping JSTD server.');
            var pid = fs.readFileSync('/tmp/jstd.pid');
            var jstd = fs.readFileSync('/tmp/jstd_server.pid');
            try {
                process.kill(pid, 'SIGKILL');
                process.kill(jstd, 'SIGTERM');
            } catch (e) {
                console.log('Couldn\'t kill the JSTD server.');
            }
        });
    });

    namespace('run', function () {
        desc('Run client tests');
        task('client', function () {
            var jstdPath = './tests/client/bin/JsTestDriver-1.3.3d.jar';

            console.log('Running client side tests...');
            var cmd = 'java -jar ' + jstdPath + ' --reset --tests all --config ' +
                      'tests/client/conf/ClientTests.jstd --verbose ' +
                      '--testOutput ./tests/client/reports';
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
                console.log('You do not have jasmine-node installed, please run "npm install -d".');
                return;
            }

            process.env.RAIN_CONF = process.cwd() + '/tests/server/fixtures/server.conf';
            var specFolder = process.cwd() + '/tests/server/tests/';
            var util = require('util');

            for (var key in jasmine) {
                global[key] = jasmine[key];
            }

            var isVerbose = true;
            var showColors = true;
            var teamcity = process.env.TEAMCITY_PROJECT_NAME || false;
            var extentions = "js";
            var match = '.';

            var junitreport = {
                report: true,
                savePath : "./tests/server/reports/",
                useDotNotation: true,
                consolidate: true
            }
            var useRequireJs = false;

            console.log('\nRunning server side tests...');

            jasmine.loadHelpersInFolder(specFolder, new RegExp("[-_]helper\\.(" + extentions + ")$"));
            jasmine.executeSpecsInFolder(specFolder, function (runner, log) {
                util.print('\n');
                if (runner.results().failedCount == 0) {
                    exitCode = 0;
                } else {
                    exitCode = 1;
                }
            }, isVerbose, showColors, teamcity, useRequireJs,
               new RegExp(match + "spec\\.(" + extentions + ")$", 'i'), junitreport);
        });

        desc('Run all tests.');
        task('all', function () {
            jake.Task['test:run:server'].invoke();
            jake.Task['test:run:client'].invoke();
        });
    });
});
