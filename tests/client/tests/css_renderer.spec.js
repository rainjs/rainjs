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

describe('CSS Renderer', function () {
    var components = {
        withCss: {
            id: 'example',
            version: '1.0',
            css: [{
                path: '/example/1.0/css/index.css',
                ruleCount: 50
            }, {
                path: '/example/1.0/css/file.css',
                ruleCount: 30
            }, {
                path: '/example/1.0/css/media.css',
                ruleCount: 100,
                media: 'all and (orientation: portrait)'
            }]
        },
        noCss: {
            id: 'example',
            version: '2.0',
            css: []
        },
        someNotFoundCss: {
            id: 'example',
            version: '1.0',
            css: [{
                path: '/example/1.0/css/not_found1.css',
                ruleCount: 0
            }, {
                path: '/example/1.0/css/file.css',
                ruleCount: 30
            }, {
                path: '/example/1.0/css/not_found2.css',
                ruleCount: 0
            }]
        },
        allNotFoundCss: {
            id: 'example',
            version: '1.0',
            css: [{
                path: '/example/1.0/css/not_found1.css',
                ruleCount: 0
            }, {
                path: '/example/1.0/css/not_found2.css',
                ruleCount: 0
            }]
        }
    };

    var fileContents = {
        '/example/1.0/css/index.css': '.class1 {}',
        '/example/1.0/css/file.css': '.class2 {}',
        '/example/1.0/css/media.css': '.class3 {}'
    };

    var decoratedContents = {
        '/example/1.0/css/index.css':
            '/* Start of file /example/1.0/css/index.css */\n' +
                '.class1 {}\n' +
            '/* End of file /example/1.0/css/index.css */\n\n',

        '/example/1.0/css/file.css':
            '/* Start of file /example/1.0/css/file.css */\n' +
                '.class2 {}\n' +
            '/* End of file /example/1.0/css/file.css */\n\n',

        '/example/1.0/css/media.css':
            '/* Start of file /example/1.0/css/media.css */\n' +
                '@media all and (orientation: portrait) {\n' +
                    '.class3 {}\n' +
                '}\n' +
            '/* End of file /example/1.0/css/media.css */\n\n'
    };

    describe('load', function () {
        it('should register the CSS files for a component',
            ['raintime/css/renderer', 'raintime/css/registry', 'util'],
            function (CssRenderer, StyleRegistry, util) {
                var options = {
                    component: components.withCss,
                    shouldSucceed: true
                };

                testLoadMethod(CssRenderer, StyleRegistry, util, options);
            }
        );

        it('should register only the new CSS files',
            ['raintime/css/renderer', 'raintime/css/registry', 'util'],
            function (CssRenderer, StyleRegistry, util) {
                var options = {
                    component: components.withCss,
                    shouldSucceed: true,
                    registryOptions: {
                        fileIndexes: [0, 2]
                    },
                    includedIndexes: [0, 2]
                };

                testLoadMethod(CssRenderer, StyleRegistry, util, options);
            }
        );

        it('should succeed for a component with no CSS files',
            ['raintime/css/renderer', 'raintime/css/registry', 'util'],
            function (CssRenderer, StyleRegistry, util) {
                var options = {
                    component: components.noCss,
                    shouldSucceed: true
                };

                testLoadMethod(CssRenderer, StyleRegistry, util, options);
            }
        );
        it('should ignore the CSS files that aren\'t found',
            ['raintime/css/renderer', 'raintime/css/registry', 'util'],
            function (CssRenderer, StyleRegistry, util) {
                var options = {
                    component: components.someNotFoundCss,
                    shouldSucceed: true,
                    includedIndexes: [1]
                };

                testLoadMethod(CssRenderer, StyleRegistry, util, options);
            }
        );
        it('should succeed when all the CSS files are already loaded',
            ['raintime/css/renderer', 'raintime/css/registry', 'util'],
            function (CssRenderer, StyleRegistry, util) {
                var options = {
                    component: components.withCss,
                    shouldSucceed: true,
                    registryOptions: {
                        fileIndexes: []
                    },
                    includedIndexes: []
                };

                testLoadMethod(CssRenderer, StyleRegistry, util, options);
            }
        );
        it('should succeed when all the CSS files for a component aren\'t found',
            ['raintime/css/renderer', 'raintime/css/registry', 'util'],
            function (CssRenderer, StyleRegistry, util) {
                var options = {
                    component: components.allNotFoundCss,
                    shouldSucceed: true,
                    includedIndexes: []
                };

                testLoadMethod(CssRenderer, StyleRegistry, util, options);
            }
        );

        it('should fail when there is no space left to register the CSS',
            ['raintime/css/renderer', 'raintime/css/registry', 'util'],
            function (CssRenderer, StyleRegistry, util) {
                var options = {
                    component: components.withCss,
                    shouldSucceed: false,
                    registryOptions: {
                        registerSucceeded: false
                    }
                };

                testLoadMethod(CssRenderer, StyleRegistry, util, options);
            }
        );
    });

    describe('unload', function () {
        it('should unregister the CSS for the specified component',
            ['raintime/css/renderer', 'raintime/css/registry', 'util'],
            function (CssRenderer, StyleRegistry, util) {
                mockDependencies(StyleRegistry, util);

                var cssRenderer = new CssRenderer(),
                    registry = StyleRegistry.get(),
                    component = components.withCss,
                    fullId = component.id + ';' + component.version;

                cssRenderer.unload.andCallThrough();
                cssRenderer._getFullId.andCallThrough();

                cssRenderer.unload(component);

                expect(registry.unregister).toHaveBeenCalledWith(fullId);
            }
        );
    });

    function testLoadMethod(CssRenderer, StyleRegistry, util, options) {
        mockDependencies(StyleRegistry, util, options.registryOptions);

        var cssRenderer = new CssRenderer(),
            registry = StyleRegistry.get(),
            isResolved;

        cssRenderer.load.andCallThrough();
        cssRenderer._decorate.andCallThrough();
        cssRenderer._getFiles.andCallThrough();
        cssRenderer._getFullId.andCallThrough();

        cssRenderer.load(options.component).then(function () {
            isResolved = true;
        }, function () {
            isResolved = false;
        });

        waitsFor(function () {
            return typeof isResolved !== 'undefined';
        });

        runs(function () {
            var fullId = options.component.id + ';' + options.component.version,
                cssContents = createCssContents(options.component, options.includedIndexes);

            expect(registry.getNewFiles).toHaveBeenCalledWith(fullId, options.component.css);

            var filesToRequest = registry.getNewFiles(fullId, options.component.css);
            for (var i = 0, len = filesToRequest.length; i < len; i++) {
                expect($.get).toHaveBeenCalledWith(filesToRequest[i].path);
            }

            expect(registry.register).toHaveBeenCalledWith(fullId, cssContents);
            expect(isResolved).toEqual(options.shouldSucceed);
        });
    }

    function mockDependencies(StyleRegistry, util, registryOptions) {
        // StyleRegistry
        var indexes = (registryOptions && registryOptions.fileIndexes),
            registerSucceeded = registryOptions && registryOptions.registerSucceeded;

        if (typeof registerSucceeded === 'undefined') {
            registerSucceeded = true;
        }

        var styleRegistry = jasmine.createSpyObj('styleRegistry',
            ['getNewFiles', 'register', 'unregister']);

        styleRegistry.getNewFiles.andCallFake(function (id, files) {
            return files.filter(function (file, index) {
                return !indexes || indexes.indexOf(index) !== -1;
            });
        });

        styleRegistry.register.andReturn(registerSucceeded);

        StyleRegistry.get.andReturn(styleRegistry);

        // util
        util.defer.andCallThrough();

        // jQuery
        spyOn($, 'get').andCallFake(function (path) {
            return {
                complete: function (fn) {
                    util.defer(function () {
                        fn({ responseText: fileContents[path], status: 200 });
                    });
                }
            };
        });
    }

    function createCssContents(component, includedIndexes) {
        var cssContents = [];

        for (var i = 0, len = component.css.length; i < len; i++){
            var item = component.css[i];
            if (!includedIndexes || includedIndexes.indexOf(i) !== -1) {
                cssContents.push({
                    path: item.path,
                    ruleCount: item.ruleCount,
                    content: decoratedContents[item.path]
                });
            }
        }

        return cssContents;
    }
});
