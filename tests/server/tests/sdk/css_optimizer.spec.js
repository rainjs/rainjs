"use strict";

describe('Css optimizer', function () {

    var fs, CssOptimizer, config, util, less, cssData, htmlData;

    beforeEach(function () {
        var mocks = {};

        config = {
            components: {
                'component1;1.0': {
                    path: '/fake/path/to/component1',
                    folder: 'component1',
                    config: {
                        views: {
                            'view1': {},
                            'view2': {
                                view: 'index.html'
                            }
                        }
                    }
                }
            },
            includedComponents: ['component;1.0'],
            outputPath: 'fake/output',
            themes: {
                theme1: 'th1',
                theme2: 'th2'
            }
        };

        fs = jasmine.createSpyObj('fs', ['writeFileSync', 'readFileSync', 'existsSync']);

        cssData = '.class {height: 100px;}';
        htmlData = '<div></div>';
        fs.readFileSync.andCallFake(function (path) {
            if(path.indexOf('.html') !== -1) {
                return htmlData;
            } else if(path.indexOf('.css') !== -1){
                return cssData;
            }
        });

        mocks['fs'] = fs;

        util = jasmine.createSpyObj('util', ['format', 'walkSync']);

        util.walkSync.andCallFake(function (path, extension, fn) {
            fn('fake.css');
        });

        mocks['../../lib/util'] = util;

        less = jasmine.createSpyObj('less', ['render']);

        mocks['less'] = less;

        CssOptimizer = loadModuleExports('/bin/lib/css_optimizer.js', mocks);

    });

    describe('Run minification', function () {

        it('should throw error if a css is corrupted and could not be minified', function () {

            var error;

            less.render.andCallFake(function (content, conf, fn) {
                error = true;
                fn(error);
            });

            var instance = new CssOptimizer(config);

            instance.run();

            waitsFor(function () {
                return (typeof error !== 'undefined');
            }, 'less render was called');

            runs(function () {
                expect(fs.writeFileSync).not.toHaveBeenCalled();
            });
        });

        it('should minify multiple files for a component in a min file', function () {

            var finished;

            less.render.andCallFake(function (content, conf, fn) {
                var data = content
                finished = true;
                fn(null, data);
            });

            util.walkSync.andCallFake(function (path, extension, fn) {
                fn('fake.css');
                fn('fake1.css');
            });

            var instance = new CssOptimizer(config);

            instance.run();

            waitsFor(function () {
                return (typeof finished !== 'undefined');
            }, 'finished rendering less');

            runs(function () {
               expect(fs.writeFileSync).toHaveBeenCalledWith(
                   'fake/output/cssMaps.json',
                   '{"component1;1.0":' +
                       '{"fake/output/components/component1/client/css/index.min.css":["fake.css","fake1.css"],' +
                            '"fake/output/components/component1/client/css/th1/index.min.css":["th1/fake.css","th1/fake1.css"],' +
                            '"fake/output/components/component1/client/css/th2/index.min.css":["th2/fake.css","th2/fake1.css"]' +
                       '}' +
                   '}'
               );

               expect(fs.writeFileSync).toHaveBeenCalledWith(
                   'fake/output/components/component1/client/css/index.min.css',
                   cssData + cssData,
                   'utf8'
               );
            });

        });

        it('should minify themes in their own folders', function () {

            var finished;

            less.render.andCallFake(function (content, conf, fn) {
                var data = content;
                finished = true;
                fn(null, data);
            });

            util.walkSync.andCallFake(function (path, extension, fn) {
                fn('fake.css');
                fn('fake1.css');
            });

            var instance = new CssOptimizer(config);

            instance.run();

            waitsFor(function () {
                return (typeof finished !== 'undefined');
            }, 'finished rendering less');

            runs(function () {
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/cssMaps.json',
                    '{"component1;1.0":' +
                        '{"fake/output/components/component1/client/css/index.min.css":["fake.css","fake1.css"],' +
                        '"fake/output/components/component1/client/css/th1/index.min.css":["fake.css","fake1.css"],' +
                        '"fake/output/components/component1/client/css/th2/index.min.css":["fake.css","fake1.css"]' +
                        '}' +
                        '}'
                );

                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/components/component1/client/css/' + config.themes.theme1 + '/index.min.css',
                    cssData + cssData,
                    'utf8'
                );

                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/components/component1/client/css/' + config.themes.theme2 + '/index.min.css',
                    cssData + cssData,
                    'utf8'
                );
            });

        });

        it('should minify css that import a less', function () {

            var finished;

            less.render.andCallFake(function (content, conf, fn) {
                var data = content;
                finished = true;
                fn(null, data);
            });

            cssData = '@import "fake.less" .css {min-width: 100px;}';

            util.walkSync.andCallFake(function (path, extension, fn) {
                fn('fake.css');
                fn('fake1.css');
            });

            var instance = new CssOptimizer(config);

            instance.run();

            waitsFor(function () {
                return (typeof finished !== 'undefined');
            }, 'finished rendering less');

            runs(function () {
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/cssMaps.json',
                    '{"component1;1.0":' +
                        '{"fake/output/components/component1/client/css/index.min.css":["fake.css","fake1.css"],' +
                        '"fake/output/components/component1/client/css/th1/index.min.css":["fake.css","fake1.css"],' +
                        '"fake/output/components/component1/client/css/th2/index.min.css":["fake.css","fake1.css"]' +
                        '}' +
                        '}'
                );

                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/components/component1/client/css/' + config.themes.theme1 + '/index.min.css',
                    '@import "components/component1/client/css/fake.less" .css {min-width: 100px;}' +
                        '@import "components/component1/client/css/fake.less" .css {min-width: 100px;}',
                    'utf8'
                );

                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/components/component1/client/css/' + config.themes.theme2 + '/index.min.css',
                    '@import "components/component1/client/css/fake.less" .css {min-width: 100px;}' +
                        '@import "components/component1/client/css/fake.less" .css {min-width: 100px;}',
                    'utf8'
                );
            });

        });

        it('should generate a json map of minified files and the destination', function () {
            var finished;

            less.render.andCallFake(function (content, conf, fn) {
                var data = content
                finished = true;
                fn(null, data);
            });

            util.walkSync.andCallFake(function (path, extension, fn) {
                fn('fake.css');
                fn('fake1.css');
            });

            var instance = new CssOptimizer(config);

            instance.run();

            waitsFor(function () {
                return (typeof finished !== 'undefined');
            }, 'finished rendering less');

            runs(function () {
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/cssMaps.json',
                    '{"component1;1.0":' +
                        '{"fake/output/components/component1/client/css/index.min.css":["fake.css","fake1.css"],' +
                        '"fake/output/components/component1/client/css/th1/index.min.css":["fake.css","fake1.css"],' +
                        '"fake/output/components/component1/client/css/th2/index.min.css":["fake.css","fake1.css"]' +
                        '}' +
                    '}'
                );
            });
        });

        it('should minify in multiple min files if rules are over 4095 and map them accordingly', function () {
            cssData = '';
            for (var i = 0; i < 4095; i++) {
                cssData += '.css {min-width: 100px}';
            }
            var finished;

            less.render.andCallFake(function (content, conf, fn) {
                var data = content
                finished = true;
                fn(null, data);
            });

            util.walkSync.andCallFake(function (path, extension, fn) {
                fn('fake.css');
                fn('fake1.css');
            });

            var instance = new CssOptimizer(config);

            instance.run();

            waitsFor(function () {
                return (typeof finished !== 'undefined');
            }, 'finished rendering less');

            runs(function () {
                //just check the json map if it has multiple mins and associated files
                expect(fs.writeFileSync.mostRecentCall.args).toEqual([
                    'fake/output/cssMaps.json',
                    '{"component1;1.0":' +
                        '{"fake/output/components/component1/client/css/index.min.css":["fake.css"],' +
                        '"fake/output/components/component1/client/css/index1.min.css":["fake1.css"],' +
                        '"fake/output/components/component1/client/css/th1/index.min.css":["fake.css"],' +
                        '"fake/output/components/component1/client/css/th1/index1.min.css":["fake1.css"],' +
                        '"fake/output/components/component1/client/css/th2/index.min.css":["fake.css"],' +
                        '"fake/output/components/component1/client/css/th2/index1.min.css":["fake1.css"]' +
                        '}' +
                    '}']
                );
            });
        });

        it('should resolve media querys for css of different components', function () {
            var finished;

            less.render.andCallFake(function (content, conf, fn) {
                var data = content;
                finished = true;
                fn(null, data);
            });

            util.walkSync.andCallFake(function (path, extension, fn) {
                fn('fake.css');
                fn('fake1.css');
            });

            fs.existsSync.andCallFake(function () {
                return true;
            });

            htmlData = '{{css path="fake.css" media="all and (min-width: 300px)"}}';

            var mediaTag = 'all and (min-width: 300px)';

            var instance = new CssOptimizer(config);

            instance.run();

            waitsFor(function () {
                return (typeof finished !== 'undefined');
            }, 'finished rendering less');

            runs(function () {
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/cssMaps.json',
                    '{"component1;1.0":' +
                        '{"fake/output/components/component1/client/css/index.min.css":["fake.css","fake1.css"],' +
                        '"fake/output/components/component1/client/css/th1/index.min.css":["fake.css","fake1.css"],' +
                        '"fake/output/components/component1/client/css/th2/index.min.css":["fake.css","fake1.css"]' +
                        '}' +
                        '}'
                );

                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/components/component1/client/css/' + config.themes.theme1 + '/index.min.css',
                    '@media ' + mediaTag + ', ' + mediaTag + '{\n' + cssData + '}' + cssData,
                    'utf8'
                );

                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    'fake/output/components/component1/client/css/' + config.themes.theme2 + '/index.min.css',
                    '@media ' + mediaTag + ', ' + mediaTag + '{\n' + cssData + '}' + cssData,
                    'utf8'
                );
            });


        });

    });

});