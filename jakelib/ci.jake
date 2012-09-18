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

var path = require('path'),
    util = require('util'),
    child = require('child_process'),
    yaml = require('js-yaml'),
    wrench = require('wrench'),
    fs = require('fs'),
    Promise = require('promised-io/promise'),
    Deferred = Promise.Deferred,
    seq = Promise.seq,
    extend = require('node.extend'),
    spawn = require('child_process').spawn;

namespace('ci', function () {
    namespace('coverage', function () {
        /**
         * Computes global coverage statistics based on the JsCoverage data object
         *
         * @param {Object} coverage the JsCoverage data object
         *
         * @returns {Object} the computed statistics
         */
        function calculateStats(coverage) {
            var stats = {
                packagesCovered: 0,
                packagesTotal: 0,
                classesCovered: 0,
                classesTotal: 0,
                methodsCovered: 0,
                methodsTotal: 0,
                srcFilesCovered: 0,
                srcFilesTotal: 0,
                srcLinesCovered: 0,
                srcLinesTotal: 0
            };

            for (var file in coverage) {
                if (coverage.hasOwnProperty(file)) {
                    stats.classesCovered++;
                    stats.classesTotal++;
                    stats.srcFilesCovered++;
                    stats.srcFilesTotal++;

                    var srcLinesTotal = 0;
                    var srcLinesCovered = 0;

                    for(var i = 0, l = coverage[file].source.length; i < l; i++) {
                        var covered = coverage[file].coverage[i + 1];

                        if (covered !== null) {
                            srcLinesTotal++;

                            if (covered > 0) {
                                srcLinesCovered++;
                            }
                        }
                    }

                    stats.srcLinesTotal += srcLinesTotal;
                    stats.srcLinesCovered += srcLinesCovered;
                }
            }

            return stats;
        }

        /**
         * Computes global coverage for a specific metric.
         *
         * @param {Object} stats the coverage statistics object
         * @param {String} metric the metric for which to compute the coverage
         *
         * @returns {Number} the coverage for the specific metric
         */
        function calculateCoverage(stats, metric) {
            var covered = stats[metric + 'Covered'];
            var total = stats[metric + 'Total'];
            var coverage = Math.round(covered / total * 100);

            return coverage;
        }

        /**
         * Computes coverage statistics for a file in the JsCoverage data map.
         *
         * @param {Object} file the file from the JsCoverage data map
         *
         * @returns {Object} the coverage statistics
         */
        function calculateFileStats(file) {
            var stats = {
                linesCovered: 0,
                linesTotal: 0,
                coverage: 0
            };

            for (var i = 0, l = file.source.length; i < l; i++) {
                var covered = file.coverage[i + 1];

                if (covered !== null) {
                    stats.linesTotal++;

                    if (covered > 0) {
                        stats.linesCovered++;
                    }
                }
            }

            stats.coverage = Math.round(stats.linesCovered / stats.linesTotal * 100);

            return stats;
        }

        /**
         * Generates an Emma report from the JsCoverage data object
         *
         * @param {Object} coverage the JsCoverage data object
         *
         * @returns {String} the generated report
         */
        function generateEmmaReport(coverage) {
            var stats = calculateStats(coverage);
            var xml = [];
            xml.push('<report>');
            xml.push('    <stats>');
            xml.push('        <packages value="' + stats.packagesTotal + '"/>');
            xml.push('        <classes value="' + stats.classesTotal + '"/>');
            xml.push('        <methods value="' + stats.methodsTotal + '"/>');
            xml.push('        <srcfiles value="' + stats.srcFilesTotal + '"/>');
            xml.push('        <srclines value="' + stats.srcLinesTotal + '"/>');
            xml.push('    </stats>');
            xml.push('    <data>');
            xml.push('        <all name="all classes">');
            xml.push('            <coverage type="line, %" value="' + calculateCoverage(stats, 'srcLines') + '%  (' + stats.srcLinesCovered + '/' + stats.srcLinesTotal +')"/>');
            xml.push('            <coverage type="block, %" value="0%   (0/0)"/>');
            xml.push('            <coverage type="method, %" value="0%   (0/0)"/>');
            xml.push('            <coverage type="class, %" value="0%   (0/0)"/>');

            for (var file in coverage) {
                if (!coverage.hasOwnProperty(file)) {
                    continue;
                }
                var fileStats = calculateFileStats(coverage[file]);
                xml.push('            <srcfile name="' + file + '">');
                xml.push('                <coverage type="line, %" value="' + fileStats.coverage + '%   (' + fileStats.linesCovered + '/' + fileStats.linesTotal +')"/>');
                xml.push('                <coverage type="block, %" value="0%   (1/1)"/>');
                xml.push('                <coverage type="method, %" value="0%   (1/1)"/>');
                xml.push('                <coverage type="class, %" value="0%   (1/1)"/>');
                xml.push('            </srcfile>');
            }

            xml.push('        </all>');
            xml.push('    </data>');
            xml.push('</report>');

            return xml.join('\n');
        }

        desc('Generate coverage report.');
        task('report', function () {
            var coverage = {};

            if (fs.existsSync('tests/server/coverage/jscoverage.json')) {
                extend(coverage, JSON.parse(fs.readFileSync('tests/server/coverage/jscoverage.json')));
            }

            if (fs.existsSync('tests/client/coverage/jscoverage.json')) {
                extend(coverage, JSON.parse(fs.readFileSync('tests/client/coverage/jscoverage.json')));
            }

            fs.writeFileSync('tests/coverage.xml', generateEmmaReport(coverage));
            jake.logger.log('generated unified Emma report at tests/coverage.xml');
            fs.writeFileSync('tests/coverage.json', JSON.stringify(coverage));
            jake.logger.log('generated unified coverage report at tests/coverage.json');
        });

        namespace('instrument', function () {

            var tool, conf;

            /**
             * Checks if the coverage tool is installed and accessible.
             * @returns {Deferred}
             */
            function check() {
                var deferred = new Deferred();

                if (tool) {
                    process.nextTick(deferred.resolve);
                    return deferred.promise;
                }

                tool = 'jscoverage';

                child.execFile(tool, [], {}, function (error) {
                    if (127 === error.code) {
                        jake.logger.log(util.format(
                                'jscoverage tool (%s) not in path', tool));
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }
                });

                return deferred.promise;
            }

            /**
             * Reads the coverage configuration.
             * @returns {Deferred}
             */
            function setup() {
                var deferred = new Deferred();

                if (conf) {
                    process.nextTick(deferred.resolve);
                    return deferred.promise;
                }

                // read configuration
                try {
                    conf = fs.readFileSync(path.join('tests',
                            'code-coverage.yml'));
                } catch (e) {
                    jake.logger.error('error reading configuration');
                    process.nextTick(deferred.reject);
                    return deferred.promise;
                }

                // parse configuration
                try {
                    conf = yaml.load(conf);
                } catch (e) {
                    jake.logger.error('error parsing configuration');
                    process.nextTick(deferred.reject);
                    return deferred.promise;
                }

                jake.logger.log('configuration loaded ok');

                // validation checks
                if (!conf.target) {
                    jake.logger.error('invalid or empty target key in configuration');
                    process.nextTick(deferred.reject);
                    return deferred.promise;
                }

                jake.logger.log(util.format('target is: %s', conf.target));

                process.nextTick(deferred.resolve);
                return deferred.promise;
            }

            /**
             * Instruments the configured directories.
             * @returns {Deferred}
             */
            function execute(side) {
                var deferred = new Deferred();

                if (!conf[side] || !conf[side].src ||
                        !Array.isArray(conf[side].src)) {
                    jake.logger.error(util.format(
                            'invalid or empty %s src key in configuration',
                            side));
                    process.nextTick(deferred.reject);
                    return deferred.promise;
                }

                // ensure target instrumentation directory is created
                try {
                    jake.mkdirP(conf.target);
                } catch (e) {
                    jake.logger.error('error creating target directory');
                    process.nextTick(deferred.reject);
                    return deferred.promise;
                }

                jake.logger.log(util.format('instrumenting %s code', side));

                // prepare each directory from configuration for instrumentation
                var cmds = [];
                for (var i = 0, l = conf[side].src.length; i < l; i++) {
                    var dir = conf[side].src[i],
                        tdir = path.join(conf.target, dir);

                    jake.logger.log(util.format(
                            'add to instrumentation queue: %s', dir));

                    try {
                        jake.mkdirP(tdir);
                    } catch (e) {
                        jake.logger.error(util.format(
                                'error creating instrumented folder: %s', dir));
                        process.nextTick(deferred.reject);
                        return deferred.promise;
                    }

                    var cmd = util.format('%s %s %s', tool, dir, tdir),
                        exclude = conf[side].exclude;

                    if (exclude) {
                        if (!Array.isArray(exclude)) {
                            jake.logger.log(
                                'ignoring exclude key: it is not a list');
                        } else {
                            exclude.forEach(function (entry) {
                                jake.logger.log(util.format(
                                        'excluding: %s', entry));
                                cmd = util.format('%s --no-instrument=%s', cmd,
                                        entry);
                            });
                        }
                    }

                    cmds.push(cmd);
                }

                jake.logger.log('instrumenting ...');

                // instrument
                jake.exec(cmds, deferred.resove, {
                    printStdout: !jake.program.opts.quiet,
                    printStderr: !jake.program.opts.quiet
                });

                jake.logger.log('done');

                return deferred.promise;
            }

            /**
             * Main function that connects all instrumentation steps:
             * check, setup & execute.
             * @returns {Deferred}
             */
            function instrument(side) {
                return seq([
                    check,
                    setup,
                    execute.bind(this, side)
                ]);
            }

            desc('Instrument client-side code for coverage report');
            task('client', function () {
                instrument('client').then(complete);
            }, {async: true});

            desc('Instrument server-side code for coverage report');
            task('server', function () {
                instrument('server').then(complete);
            }, {async: true});

            desc('Instrument all code for coverage report');
            task('all', function () {
                var client = jake.Task['ci:coverage:instrument:client'],
                    server = jake.Task['ci:coverage:instrument:server'];

                client.addListener('complete', server.invoke.bind(server));
                server.addListener('complete', complete);

                client.invoke();
            }, {async: true});
        });

        namespace('run', function () {
            desc('Run server tests and generate report');
            task('server', function () {
                require('jasmine-node');
                require('jscoverage-reporter');

                var specList, specs = require('jasmine-node/lib/jasmine-node/spec-collection');

                //extend jasmine with functionality needed by Rain
                require('../tests/server/lib/jasmine_rain');

                process.env.RAIN_CONF = process.cwd() + '/tests/server/fixtures/server.conf';
                process.env.RAIN_COVERAGE = 1;

                var jasmineEnv = jasmine.getEnv();

                var specFolder = process.cwd() + '/tests/server/tests/';
                var reportsPath = path.join('tests', 'server', 'coverage');

                for (var key in jasmine) {
                    if (key !== 'undefined') {
                        global[key] = jasmine[key];
                    }
                }

                wrench.rmdirSyncRecursive(reportsPath, true);
                wrench.mkdirSyncRecursive(reportsPath);

                specs.load(specFolder, /(.*).spec\.js/i);
                specList = specs.getSpecs();

                for (var i = 0, len = specList.length; i < len; ++i) {
                  var filename = specList[i];
                  require(filename.path().replace(/\.\w+$/, ""));
                }

                jasmineEnv.addReporter(new jasmine.JSCoverageReporter(reportsPath));

                jake.logger.log('generating code coverage report for server code ...');
                jasmineEnv.execute();
                jake.logger.log('done.');
            });


            desc('Run server tests and generate report');
            task('client', function () {
                var connect = require('connect');
                var jstdPath = './tests/client/bin/JsTestDriver-1.3.3d.jar';
                var reportsPath = path.join('tests', 'client', 'coverage');
                var report = [];

                connect().use(function (req, res) {
                    req.on('data', function (chunk) {
                        report.push(chunk.toString());
                    });

                    req.on('end', function () {
                        res.end();
                    });
                }).listen(8765);

                console.log('Running client side tests...');
                var cmd = 'java -jar ' + jstdPath + ' --reset --tests all --config ' +
                          'tests/client/conf/ClientCoverage.jstd ' +
                          '--testOutput ./tests/client/reports';
                child.exec(cmd, function (error, stdout, stderr) {
                    wrench.rmdirSyncRecursive(reportsPath, true);
                    wrench.mkdirSyncRecursive(reportsPath);

                    fs.writeFileSync(path.join(reportsPath, 'jscoverage.json'), (report.join('') || '{}'));
                    jake.logger.log('Wrote coverage report in ' + reportsPath + '/jscoverage.json');
                    process.exit();
                });
            });
        });

        namespace('server', function () {
            desc('Start the JSTD server and the RAIN server using the instrumented code');
            task('start', function () {
                var task = jake.Task['test:server:start'];
                task.invoke();

                console.log('Starting RAIN...');

                var child = spawn('raind', [],
                    {stdio: 'inherit', env: {
                        RAIN_CONF: './tests/client/conf/server.conf.default',
                        PATH: process.env.PATH
                    }});

                if (process.platform !== 'win32') {
                    var stopRain = function () {
                        child.kill('SIGTERM');
                    };

                    process.on('SIGTERM', stopRain);
                    process.on('SIGQUIT', stopRain);
                    process.on('SIGINT', stopRain);
                    process.on('SIGSTOP', stopRain);
                }
            });
        });
    });
});
