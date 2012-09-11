// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";

var child = require('child_process');
var fs = require('fs');
var path = require('path');
var util = require('./lib/util');

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
            console.log('JSTD server started. Now capture your browser by going to http://localhost:9876');

            var jstdPath = './tests/client/bin/JsTestDriver-1.3.3d.jar';
            var jstdPort = 9876;
            var args = [
                '-jar', jstdPath,
                '--port', jstdPort
            ];
            var jstd = child.spawn('java', args);
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

        desc('Run server tests.    USE: test:run:server[filname1,filename2] without .spec.js! to test separated files');
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

            for (var key in jasmine) {
                if (key !== 'undefined') {
                    global[key] = jasmine[key];
                }
            }

            //extend jasmine with functionality needed by Rain
            require(process.cwd() + '/tests/server/lib/jasmine_rain');

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

            if (arguments.length == 1) {
                match = arguments[0];
            } else if (arguments.length > 0) {
                match = [];
                for (var i = 0, len = arguments.length; i < len; i++) {
                    match.push(arguments[i]);
                }
                match = match.join('|');
            }

            jasmine.loadHelpersInFolder(specFolder, new RegExp("[-_]helper\\.(" + extentions + ")$"));
            jasmine.executeSpecsInFolder(specFolder, function (runner, log) {
                util.print('\n');

                var runner = jasmine.getEnv().currentRunner_,
                    suite, spec;

                for (var i = runner.suites_.length; i--;) {
                    suite = runner.suites_[i];
                    for (var j = suite.specs_.length; j--;) {
                        spec = suite.specs_[j];

                        if (spec.didFail) {
                            process.exit(1);
                        }
                    }
                }
            }, isVerbose, showColors, teamcity, useRequireJs,
               new RegExp(match + "\.spec\\.(" + extentions + ")$", 'i'), junitreport);
        });

        desc('Run all tests.');
        task('all', function () {
            jake.Task['test:run:server'].invoke();
            jake.Task['test:run:client'].invoke();
        });
    });
});

namespace('check', function () {
    desc('Check all the files for the license header');
    task('license', function () {
        var root = process.cwd(),
            hasErrors = false,
            includedFolders = [
                'lib'
            ];

        console.log('Checking for missing headers in the source files.\n');

        for (var i = includedFolders.length; i--;) {
            var folder = includedFolders[i];
            util.walkSync(path.join(root, folder), ['.js'], function (file) {
                fs.readFile(file, 'utf-8', function (err, data) {
                    if (err) {
                        return; // something went horribly wrong
                    }

                    if (/^\/\/(.*)/ig.test(data)) {
                        return; // nothing to de here
                    }

                    console.log(file, 'does not contain the license header');
                    hasErrors = true;
                });
            });
        }

        process.on('exit', function () {
            if (hasErrors) {
                process.exit(1);
            } else {
                console.log('Everything is good!');
            }
        });
    });
});
