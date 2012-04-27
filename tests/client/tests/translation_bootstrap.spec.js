describe('translation bootstrap', function () {
    /**
     * Keeps references to spies.
     * @type {Object}
     */
    var spy = {
        translate: jasmine.createSpy()
    };

    /**
     * Fixtures for this suite.
     */
    var fixtures = {
            normal: {
                name: 'harry potter',
                deps: ['inspiration'],
                fn: function () {},
                args: [],
                component: {
                    id: 'harry',
                    version: '2.0',
                    url: '/harry/1.0/js/potter.js'
                }
            },
            translation: {
                name: 'harry potter',
                deps: ['inspiration'],
                fn: function (t, nt) {},
                args: [
                    {
                        get: function () {
                            return { translate: spy.translate };
                        }
                    },
                    {} // locale
                ],
                component: {
                    id: 'harry',
                    version: '2.0',
                    url: '/harry/2.0/js/potter.js'
                }
            }
        };

    /**
     * Keeps references to original functions.
     * @type {Object}
     */
    var old = {};

    /**
     * Keeps references to functions redefined by
     * the module under test.
     *
     * This is necessary because requireJS caches the module
     * and doesn't reload it for all the specs except the first one
     * and since the module runs code when required, we need
     * these references to reset them before each spec.
     */
    var test = {};

    /**
     * Ensures the suite beforeEach() runs only once.
     * @type {Boolean}
     */
    var once;

    beforeEach(function () {
        if (once) {
            // running this step only once ensures that 
            // the original spy.define and test.define are
            // kept
            return;
        }

        runs(function () {
            // save original functions
            old.define = define;
            old.onScriptLoad = require.onScriptLoad;
            old.execCb = require.execCb;

            // the translation bootstrap module overwrites the define() function;
            // we need a spy on the original define() function, but we can't
            // just spy it because it needs to be called so that dependencies for it()
            // still work
            spy.define = spyOn(window, 'define').andCallThrough();
            spy.onScriptLoad = spyOn(require, 'onScriptLoad').andCallThrough();
            spy.execCb = spyOn(require, 'execCb').andCallThrough();
        });

        runs(function () {
            require(['raintime/translation_bootstrap'], function () {
                test.define = define;
                test.onScriptLoad = require.onScriptLoad;
                test.execCb = require.execCb;
            });
        });

        waitsFor(function () {
            return !!test.define;
        });

        runs(function () {
            once = true;
        })
    });

    /**
     * Step to run after all specs in this suite are done.
     *
     * Brings back the original functions from requireJS
     * so that this suite may be run alongside other suites.
     *
     * Jasmine doesn't explicitly support tearDown steps but
     * this can be achieved by calling this function using
     * this.after() in the last spec.
     *
     * This only works because specs are run in a well determined
     * order in Jasmine.
     */
    function tearDown() {
        define = old.define;
        require.onScriptLoad = old.onScriptLoad;
        require.execCb = old.execCb;
    }

    describe('define()', function () {

        beforeEach(function () {
            // Jamsine clears the spies after every spec, which
            // means define() will be set to the original requireJS function.
            // Since requireJS doesn't reload the module under test,
            // it means we lose the translation define() function, so we bring it back
            // here artificially.
            define = test.define;

        });

        it('should pass arguments through to define() when all parameters are specified',
            function () {

                var fx = $.extend(true, {}, fixtures.normal);

                // reset to no longer call through for the purpose of testing the new define()
                // but still have access to the original define() spy
                spy.define.andCallFake(function () {});

                // test
                define(fx.name, fx.deps, fx.fn);

                expect(spy.define).toHaveBeenCalledWith(
                    fixtures.normal.name,
                    fixtures.normal.deps,
                    fixtures.normal.fn
                );
        });

        it('should pass correct arguments to define() when name is missing',
            function () {
                var fx = $.extend(true, {}, fixtures.normal);
                define(fx.deps, fx.fn);
                expect(spy.define).toHaveBeenCalledWith(
                    fixtures.normal.deps,
                    fixtures.normal.fn
                );
        });

        it('should pass correct arguments to define() when deps are missing',
            function () {
                var fx = $.extend(true, {}, fixtures.normal);
                define(fx.name, fx.fn);
                expect(spy.define).toHaveBeenCalledWith(
                    fixtures.normal.name,
                    [],
                    fixtures.normal.fn
                );
        });

        it('should pass correct arguments to define() when name & deps are missing',
            function () {
                define(fixtures.normal.fn);
                expect(spy.define).toHaveBeenCalledWith([], fixtures.normal.fn);
        });

    });

    describe('define(), onScriptLoad() and execCb() integration', function () {

        beforeEach(function () {
            spy.require = spyOn(window, 'require');
            // Since spies are cleared at the end of every spec, make sure
            // these functions are restored
            require.onScriptLoad = test.onScriptLoad;
            require.execCb = test.execCb;
            define = test.define;
        });

        /**
         * Sets up a driver for require(), to simulate requireJS' flow.
         *
         * @param {Object} fx the fixture to use
         */
        function setupRequireSpy(fx) {
            // require() calls define() ...
            spy.require.andCallFake(
                define.bind(null, fx.name, fx.deps, fx.fn));

            // define() calls onScriptLoad()
            spy.define.andCallFake(function () {
                var node = $('<script/>', { 'data-requiremodule': fx.component.url }),
                    evt = {
                        type: 'load',
                        currentTarget: node.get(0)
                    };

                require.onScriptLoad(evt);
            });

            // onScriptLoad() calls execCb()
            spy.onScriptLoad.andCallFake(
                require.execCb.bind(require, fx.component.url, fx.fn, fx.args, {}));
        }

        describe('without translation support', function () {

            it('should fallback to the normal behavior',
                function () {
                    var fx = $.extend(true, {}, fixtures.normal);
                    // keep a copy of the original args array passed to execCb()
                    // for assertion
                    var args = [].concat(fx.args);

                    setupRequireSpy(fx);

                    // test using the require driver just set up
                    require();

                    expect(spy.execCb).toHaveBeenCalledWith(
                        fx.component.url, fx.fn, args, {});
            });

        });

        describe('with translation support', function () {

            it('should add translation dependencies',
                function () {
                    var fx = $.extend(true, {}, fixtures.translation);
                    // keep a copy of the original deps array for assertion,
                    // because the reference is altered in the require process
                    var deps = [].concat(fx.deps);

                    setupRequireSpy(fx);
                    // reset onScriptLoad spy for this test because execCb() normally
                    // pops out dependencies inserted by onScriptLoad()
                    spy.onScriptLoad.reset();

                    // test
                    require();

                    expect(fx.deps).toEqual(
                        deps.concat([
                            'raintime/translation',
                            'locale!' + fx.component.id + '/' + fx.component.version
                        ]));
            });

            it('should add t() and nt() function references as arguments to callback',
                function () {
                    var fx = $.extend(true, {}, fixtures.translation);

                    setupRequireSpy(fx);

                    // test
                    require();

                    var nt = fx.args.pop(),
                        t = fx.args.pop();

                    // test
                    t('msgid', ['harry', 'potter']);
                    expect(spy.translate).toHaveBeenCalledWith(
                        'msgid', undefined, undefined, ['harry', 'potter']);

                    // test
                    nt('msgid', 5, ['harry', 'potter']);
                    expect(spy.translate).toHaveBeenCalledWith(
                        'msgid', 5, ['harry', 'potter']);

                    this.after(tearDown);
            });

        });

    });

});
