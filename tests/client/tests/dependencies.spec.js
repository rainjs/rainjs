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

describe('Client side dependencies', function () {

    var spy = {
            translate: jasmine.createSpy(),
            logger: jasmine.createSpyObj('logger', ['debug', 'info', 'warn', 'error', 'fatal']),
            require: {}
        },
        args = {
            translate: {
                get: function () {
                    return { translate: spy.translate };
                }
            },
            logger: {
                get: function () {
                    return spy.logger;
                }
            },
            locale: {}
        },
        context = {},
        fixture = {},
        once, testDefine, evt, fn, translationDeps, moduleIndex = 0;

    /**
     * Keeps references to functions redefined by the module under test.
     *
     * This is necessary because requireJS caches the module and doesn't reload it for all the specs
     * except the first one and since the module runs code when required, we need these references
     * to reset them before each spec.
     */
    var test = {};

    beforeEach(function () {
        if (once) {
            return;
        }

        window.rainContext = {
            language: 'en_US'
        };

        spy.define = spyOn(window, 'define').andCallThrough();
        spy.requireLoad = spyOn(require, 'load').andCallThrough();

        runs(function () {
            require(['raintime/dependencies'], function () {
                test.define = define;
                test.requireLoad = require.load;
            });
        });

        waitsFor(function () {
            return !!test.define;
        });

        runs(function () {
            once = true;
        });

    });

    describe('define()', function () {
        beforeEach(function () {
            spy.define.andCallFake(function () {});
            // Jasmine clears the spies after every spec, which means define() will be set to the
            // original requireJS function. Since requireJS doesn't reload the module under test, it
            // means we lose the dependencies define() function, so we bring it back here
            // artificially.
            testDefine = test.define;
            fn = function() {};
        });

        it('should pass all arguments through to define()', function () {
            testDefine(['dep1', 'dep2'], fn);
            expect(spy.define).toHaveBeenCalledWith(['dep1', 'dep2'], fn);
        });

        it('should pass correct arguments to define() when name & deps are missing', function () {
            testDefine(fn);
            expect(spy.define).toHaveBeenCalledWith([], fn);
        });

        it('should properly call define when order plugin is used', function () {
            testDefine('name', ['deps'], 'callback');
            expect(spy.define).toHaveBeenCalledWith('name', ['deps'], 'callback');
        });

        it('should pass all arguments through to define() when module name is specified',
            function () {
            testDefine('name', ['dep1', 'dep2'], fn);
            expect(spy.define).toHaveBeenCalledWith('name', ['dep1', 'dep2'], fn);
        });
    });

    describe('define, execCb and onScripLoad integration ', function () {
        beforeEach(function () {

            fixture = {
                name: 'harry/2.0/js/potter',
                deps: [],
                fn: function () {},
                args: [],
                component: {
                    id: 'harry',
                    version: '2.0',
                    url: '/harry/2.0/js/potter.js'
                }
            };

            fixture.name += moduleIndex++;

            var node = $('<script/>', { 'data-requiremodule': fixture.component.url });
            evt = {
                type: 'load',
                currentTarget: node.get(0)
            };

            translationDeps = [
                'raintime/translation',
                'locale!' + fixture.component.id + '/' + fixture.component.version + '/en_US'
            ];

            spy.requireLoad.andCallFake(function(){});

            spy.onScriptLoad = spyOn(window, 'onScriptLoad');
            spy.execCb = spyOn(window, 'execCb');

            context = {
                onScriptLoad: spy.onScriptLoad,
                execCb: spy.execCb
            };

            // require() calls define() ...
            spy.require = spyOn(window, 'require').andCallFake(function() {
                testDefine(fixture.name, fixture.deps, fixture.fn);
            });

            // Get onScriptLoad and execCb from context
            test.requireLoad(context);

            test.onScriptLoad = context.onScriptLoad;
            test.execCb = context.execCb;

            // define() calls onScriptLoad()
            spy.define.andCallFake(function() {
                test.onScriptLoad(evt);
            });

            // onScriptLoad() calls execCb()
            spy.onScriptLoad.andCallFake(function() {
                test.execCb(fixture.name, fixture.fn, fixture.args, {});
            });

            spy.execCb.andCallFake(function() {});
        });

        it('should follow to the normal behavior', function () {
            require();

            expect(spy.onScriptLoad).toHaveBeenCalledWith(evt);
            expect(spy.execCb).toHaveBeenCalledWith(
                fixture.name,
                fixture.fn,
                fixture.args,
                {});
        });

        it('should add translation dependencies when both t and nt are used', function () {
            fixture.deps = ['t', 'nt'];
            fixture.args = [args.translate, args.locale];

            require();

            expect(fixture.deps).toEqual(translationDeps);

            var nt = fixture.args.pop(),
                t = fixture.args.pop();

            t('msgid', ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', ['harry', 'potter'], undefined,
                                                         undefined, undefined );

            nt('msgid', 5, ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', 5, ['harry', 'potter']);
        });

        it('should add translation dependencies when only nt is used', function () {
            fixture.deps = ['nt'];
            fixture.args = [args.translate, args.locale];

            require();

            expect(fixture.deps).toEqual(translationDeps);

            var nt = fixture.args.pop();

            nt('msgid', 5, ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', 5, ['harry', 'potter']);
        });


        it('should add translation dependencies when only t is used', function () {
            fixture.deps = ['t'];
            fixture.args = [args.translate, args.locale];

            require();

            expect(fixture.deps).toEqual(translationDeps);

            var t = fixture.args.pop();

            t('msgid', 5, ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', 5, ['harry', 'potter']);
        });

        it('should add translation dependencies when t, nt and other dependencies are used',
            function () {
            fixture.deps = ['t', 'nt', 'foo'];
            fixture.args = [args.translate, args.locale];

            require();

            expect(fixture.deps).toEqual(['foo'].concat(translationDeps));

            var nt = fixture.args.pop(),
                t = fixture.args.pop();

            t('msgid', ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', ['harry', 'potter'], undefined,
                                                         undefined, undefined );

            nt('msgid', 5, ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', 5, ['harry', 'potter']);
        });

        it('should add translation dependencies only t and other dependencies are used',
            function () {
            fixture.deps = ['t', 'foo'];
            fixture.args = [args.translate, args.locale];

            require();

            expect(fixture.deps).toEqual(['foo'].concat(translationDeps));

            var t = fixture.args.pop();

            t('msgid', ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', ['harry', 'potter'], undefined,
                                                         undefined, undefined );
        });

        it('should add translation dependencies only nt and other dependencies are used',
            function () {
            fixture.deps = ['nt', 'foo'];
            fixture.args = [args.translate, args.locale];

            require();

            expect(fixture.deps).toEqual(['foo'].concat(translationDeps));

            var nt = fixture.args.pop();

            nt('msgid', 5, ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', 5, ['harry', 'potter']);
        });

        it('should add logger dependencies', function () {
            fixture.deps = ['logger'];
            fixture.args = [args.logger];

            require();

            expect(fixture.deps).toEqual(['raintime/logger']);

            var logger = fixture.args.pop();

            logger.info('msg');
            expect(spy.logger.info).toHaveBeenCalledWith('msg');
        });

        it('should add logger dependencies when other dependencies are used', function () {
            fixture.deps = ['foo', 'logger'];
            fixture.args = [args.logger];

            require();

            expect(fixture.deps).toEqual(['foo', 'raintime/logger']);

            var logger = fixture.args.pop();

            logger.info('msg');
            expect(spy.logger.info).toHaveBeenCalledWith('msg');
        });

        it('should add all special dependencies properly', function () {
            fixture.deps = ['t', 'nt', 'logger'];
            fixture.args = [args.translate, args.locale, args.logger];

            require();

            expect(fixture.deps).toEqual(translationDeps.concat(['raintime/logger']));

            var logger = fixture.args.pop(),
                nt = fixture.args.pop(),
                t = fixture.args.pop();

            logger.info('msg');
            expect(spy.logger.info).toHaveBeenCalledWith('msg');

            t('msgid', ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', ['harry', 'potter'], undefined,
                                                         undefined, undefined );

            nt('msgid', 5, ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', 5, ['harry', 'potter']);
        });


        it('should add all special dependencies properly when other dependecies are used',
            function () {
            fixture.deps = ['t', 'nt', 'foo', 'logger'];
            fixture.args = [args.translate, args.locale, args.logger];

            require();

            expect(fixture.deps).toEqual(
                ['foo'].concat(translationDeps.concat(['raintime/logger'])));

            var logger = fixture.args.pop(),
                nt = fixture.args.pop(),
                t = fixture.args.pop();

            logger.info('msg');
            expect(spy.logger.info).toHaveBeenCalledWith('msg');

            t('msgid', ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', ['harry', 'potter'], undefined,
                                                         undefined, undefined );

            nt('msgid', 5, ['harry', 'potter']);
            expect(spy.translate).toHaveBeenCalledWith( 'msgid', 5, ['harry', 'potter']);
        });

    });

});



