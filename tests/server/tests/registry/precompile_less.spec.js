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

describe('Registry Plugin: Precompile Less Plugin', function () {
    var precompileLess, path, fs, mime, less, componentRegistry, cssRoute, util, logger,
        filePaths, componentConfig, lessError, content, time;

    beforeEach(function () {
        componentConfig = {
            id: 'example',
            version: '3.0',
            paths: function (folder) {
                return folder;
            }
        };
        lessError = null;
        cssRoute = {
            route: /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)?(?:css)\/(.+)/
        };
        filePaths = ['css/index.css', 'css/example.css', 'css/common.less'];
        content = '{ border: none; }';
        time = 100;

        path = jasmine.createSpyObj('path', ['join', 'extname']);
        path.join.andCallFake(function (pathA, pathB) {
            return pathA + '/' + pathB;
        });

        fs = jasmine.createSpyObj('fs', ['readFileSync', 'statSync']);
        fs.readFileSync.andReturn(content);
        fs.statSync.andReturn({
            mtime: time
        });

        mime = jasmine.createSpyObj('mime', ['lookup']);
        mime.lookup.andCallFake(function (path) {
            if (path.indexOf('.css') > 0) {
                return 'text/css';
            }
            return 'other';
        });

        less = jasmine.createSpyObj('less', ['render']);
        less.render.andCallFake(function (content, cb) {
            cb(lessError, content);
        });

        componentRegistry = jasmine.createSpyObj('componentRegistry',
                                                 ['getLatestVersion', 'getConfig']);
        componentRegistry.getConfig.andReturn(componentConfig);

        util = jasmine.createSpyObj('util', ['walkSync', 'format']);
        util.walkSync.andCallFake(function (cssFolder, cb) {
            for (var i = 0, len = filePaths.length; i < len; i++) {
                cb(filePaths[i]);
            }
        });

        logger = jasmine.createSpyObj('logger', ['debug', 'info', 'warn', 'error', 'fatal']);

        var mocks = {
            'path': path,
            'fs': fs,
            'mime': mime,
            'less': less,
            '../component_registry': componentRegistry,
            '../routes/css': cssRoute,
            '../util': util,
            '../logging': {
                get: function () {
                    return logger;
                }
            }
        };

        precompileLess = loadModuleExports('/lib/registry/precompile_less.js', mocks);
    });

    describe('configure', function () {

        beforeEach(function () {
            spyOn(precompileLess, '_rewriteCssUrls');
            precompileLess._rewriteCssUrls.andReturn(content);

            spyOn(precompileLess, '_computeRules');
            precompileLess._computeRules.andReturn(1);
        });

        it('should ignore the files with the wrong content type', function () {
            precompileLess.configure(componentConfig);

            expect(less.render.callCount).toEqual(2);
        });

        it('should rewrite the urls before less rendering', function () {
            filePaths = ['index.css'];
            less.render.andCallFake(function () {});

            precompileLess.configure(componentConfig);

            expect(precompileLess._rewriteCssUrls).toHaveBeenCalledWith(
                'index.css',
                content,
                componentConfig,
                {
                    importedFiles: [filePaths[0]],
                    lastModified: time
                }
            );
        });

        it('should throw an error if less rendering failed', function () {
            lessError = new RainError('render error');
            var configure = precompileLess.configure.bind(precompileLess, componentConfig);

            expect(configure).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
        });

        it('should throw an error if a filesystem error occurred', function () {
            fs.readFileSync.andCallFake(function () {
                throw new Error('file system error');
            });

            var configure = precompileLess.configure.bind(precompileLess, componentConfig);

            expect(configure).toThrowType(RainError.ERROR_IO);
        });

        it('should save the precompiled less content', function () {
            precompileLess.configure(componentConfig);

            expect(precompileLess._computeRules).toHaveBeenCalled();
            expect(componentConfig.compiledCSS['index.css']).toEqual({
                content: content,
                noRules: 1,
                lastModified: time
            });
        });
    });

    describe('_computeRules', function () {

        it('should count zero rules', function () {
            expect(precompileLess._computeRules('')).toEqual(0);
        });

        it('should count multiple rules', function () {
            var css = [
                '{ border: none; }',
                '{ width: 1px solid #fff; }'
            ].join('\n');

            expect(precompileLess._computeRules(css)).toEqual(2);
        });

        it('should ignore rules found in comments', function () {
            var css = [
                '/* { border: none; } */',
                '/* \n {1}{2}{3} \n*/',
                '.class { width: 1px solid #fff; }',
                '#id { height: 100%; }',
                '/* // {1} {2}} \\ \ / */'
            ].join('\n');

            expect(precompileLess._computeRules(css)).toEqual(2);
        });
    });

    describe('_rewriteCssUrls', function () {
        var config, rewriteData;

        beforeEach(function () {
            config = {
                id: componentConfig.id,
                version: componentConfig.version
            };
            rewriteData = {
                importedFiles: ['css/index.css'],
                lastModified: 100
            };

            spyOn(precompileLess, '_getCssFromUrl');
            spyOn(precompileLess, '_getCssFromComponent');
        });

        it('should ignore import rules that are not recognized', function () {
            var css = [
                '@import ;',
                '@import url()',
                ' @import url(") ; '
            ].join('\n');

            expect(precompileLess._rewriteCssUrls('index.css', css,
                                                  config, rewriteData)).toEqual('\n\n');
        });

        it('should ignore external imported links', function () {
            var css = [
                '@import url("http://rain.com/css/index.css");',
                '@import url("https://rain.com/css/other.css");'
            ].join('\n');

            expect(precompileLess._rewriteCssUrls('index.css', css, config,
                                                  rewriteData)).toEqual('\n');
        });

        it('should remove the import statement if it refers to a resource that\'s missing ' +
           'from another component', function () {
            precompileLess._getCssFromUrl.andReturn(undefined);

            var css = '@import "/example/css/common.less";';

            expect(precompileLess._rewriteCssUrls('index.css', css,
                                                  config, rewriteData)).toEqual('');
        });

        it('should correctly import the CSS from another\'s component resource', function () {
            var result = 'imported content';
            precompileLess._getCssFromUrl.andReturn(result);

            var css = '@import "/example/css/common.less";';

            expect(precompileLess._rewriteCssUrls('index.css', css,
                                                  config, rewriteData)).toEqual(result);
        });

        it('should get the CSS from the a resource of the current component', function () {
            var css = '@import "common.less";';

            precompileLess._rewriteCssUrls('index.css', css, config, rewriteData);

            expect(precompileLess._getCssFromComponent).toHaveBeenCalledWith(
                config.id, config.version, 'common.less', rewriteData
            );
        });

        it('should not rewrite statements that don\'t contain URLs', function () {
            var css = [
                '{ border: none; }',
                '/* custom rules follow */'
            ].join('\n');

            expect(precompileLess._rewriteCssUrls('index.css', css,
                                                  config, rewriteData)).toEqual(css);
        });

        it('should not rewrite statements that contain external or relative URLs', function () {
            var css = [
                '{ background: url("http://rain.com/images/picture.png"); }',
                '{ background: url("https://rain.com/images/picture.png"); }',
                '{ background: url("/example/resources/images/picture.png"); }'
            ].join('\n');

            expect(precompileLess._rewriteCssUrls('index.css', css,
                                                  config, rewriteData)).toEqual(css);
        });

        it('should rewrite statements that contain internal URLs', function () {
            var css = '{ background: url("images/picture.png"); }',
                result = '{ background: url("/' + config.id + '/' + config.version +
                         '/resources/images/picture.png"); }';

            expect(precompileLess._rewriteCssUrls('index.css', css,
                                                  config, rewriteData)).toEqual(result);
        });
    });

    describe('_getCssFromUrl', function () {
        var rewriteData;

        beforeEach(function () {
            rewriteData = {
                importedFiles: ['css/index.css'],
                lastModified: 100
            };
        });

        it('should ignore an invalid CSS route url', function () {
            var url = '/a/b/c/d/e/f';

            expect(precompileLess._getCssFromUrl(url, rewriteData)).toBeUndefined();
        });

        it('should ignore an url for an invalid component', function () {
            var url = '/example/3.0/css/index.css';
            componentRegistry.getLatestVersion.andReturn(undefined);

            expect(precompileLess._getCssFromUrl(url, rewriteData)).toBeUndefined();
        });

        it('should get the css from the detected component', function () {
            var url = '/example/3.0/css/index.css';
            componentRegistry.getLatestVersion.andReturn('3.5');
            spyOn(precompileLess, '_getCssFromComponent');
            precompileLess._getCssFromComponent.andReturn('rules');

            var css = precompileLess._getCssFromUrl(url, rewriteData);

            expect(componentRegistry.getLatestVersion).toHaveBeenCalledWith('example', '3.0');
            expect(precompileLess._getCssFromComponent).toHaveBeenCalledWith(
                'example', '3.5', 'index.css', rewriteData
            );
            expect(css).toEqual('rules');
        });
    });

    describe('_getCssFromComponent', function () {
        var rewriteData;

        beforeEach(function () {
            rewriteData = {
                importedFiles: ['css/index.css'],
                lastModified: 100
            };
        });

        it('should not get the css contents if it was previously obtained', function () {
            expect(precompileLess._getCssFromComponent('example', '3.0',
                                                       'index.css', rewriteData)).toEqual('');
            expect(rewriteData.importedFiles.length).toEqual(1);
        });

        it('should not get the css contents if the content type is wrong', function () {
            path.extname.andReturn('.format');

            expect(precompileLess._getCssFromComponent('example', '3.0',
                                                       'other.format', rewriteData)).toEqual('');
            expect(rewriteData.importedFiles.length).toEqual(2);
        });

        it('should rewrite the css for the imported css content', function () {
            fs.statSync.andReturn({
                mtime: 200
            });
            spyOn(precompileLess, '_rewriteCssUrls');
            precompileLess._rewriteCssUrls.andReturn('rules');

            expect(precompileLess._getCssFromComponent('example', '3.0',
                                                       'other.css', rewriteData)).toEqual('rules');
            expect(rewriteData.importedFiles.length).toEqual(2);
            expect(rewriteData.lastModified).toEqual(200);
            expect(precompileLess._rewriteCssUrls).toHaveBeenCalledWith(
                    'other.css', content, componentConfig, rewriteData
            );
        });

        it('should throw an error if a filesystem error occurred', function () {
            fs.readFileSync.andCallFake(function () {
                throw new Error('file system error');
            });

            var getCssFromComponent = precompileLess._getCssFromComponent.bind(precompileLess,
                                           'example', '3.0', 'other.css', rewriteData);
            expect(getCssFromComponent).toThrowType(RainError.ERROR_IO);
        });
    });
});
