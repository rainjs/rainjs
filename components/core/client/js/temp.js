
    describe('define(), onScriptLoad() and execCb() integration', function () {

        beforeEach(function () {
            spy.require = spyOn(window, 'require');
            // Since spies are cleared at the end of every spec, make sure
            // these functions are restored
            require.onScriptLoad = test.onScriptLoad;
            require.execCb = test.execCb;
            require.jsExtRegExp = test.jsExtRegExp;
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

        describe('without dependencies support', function () {

            it('should fallback to the normal behavior', function () {
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

            it('should resolve dependency paths for components', function () {
                var fx = $.extend(true, {}, fixtures.component);
                var deps = [].concat(fx.deps);
                // only the first dependency should be modified
                deps[0] = fx.component.id + '/' + fx.component.version + '/' + deps[0];

                setupRequireSpy(fx);

                require();

                expect(fx.deps).toEqual(deps);
            });
        });

        describe('with dependencies support', function () {

            it('should add translation dependencies', function () {
                var fx = $.extend(true, {}, fixtures.translation);
                // keep a copy of the original deps array for assertion,
                // because the reference is altered in the require process
                var deps = [].concat(fx.deps);

                setupRequireSpy(fx);
                // reset onScriptLoad spy for this test because execCb() normally
                // pops out dependencies inserted by onScriptLoad()
                spy.onScriptLoad.reset();

                window.rainContext = {
                    language: 'en_US'
                };

                // test
                require();

                expect(fx.deps).toEqual(
                    deps.concat([
                        'raintime/translation',
                        'locale!' + fx.component.id + '/' + fx.component.version + '/en_US'
                    ]));
            });

            it('should add t() and nt() function references as arguments to callback', function () {
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

            it('should add logger dependencies', function () {
               var fx = $.extend(true, {}, fixtures.logger);
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
                       'raintime/logger'
                   ]));
            });

            it('should add logger function references as arguments to callback', function () {
               var fx = $.extend(true, {}, fixtures.logger);

               setupRequireSpy(fx);

               // test
               require();

               var loggerDep = fx.args.pop();

               // test
               loggerDep.info('msg');
               expect(logger.info).toHaveBeenCalledWith('msg');

               this.after(tearDown);
            });

            it('should add all dependencies', function () {
                var fx = $.extend(true, {}, fixtures.all);
                // keep a copy of the original deps array for assertion,
                // because the reference is altered in the require process
                var deps = [].concat(fx.deps);

                setupRequireSpy(fx);
                // reset onScriptLoad spy for this test because execCb() normally
                // pops out dependencies inserted by onScriptLoad()
                spy.onScriptLoad.reset();

                window.rainContext = {
                    language: 'en_US'
                };

                // test
                require();

                expect(fx.deps).toEqual(
                    deps.concat([
                        'raintime/translation',
                        'locale!' + fx.component.id + '/' + fx.component.version + '/en_US',
                        'raintime/logger'
                    ]));
            });

            it('should add all function references as arguments to callback', function () {
                var fx = $.extend(true, {}, fixtures.all);

                setupRequireSpy(fx);

                require();

                var loggerDep = fx.args.pop(),
                    nt = fx.args.pop(),
                    t = fx.args.pop();

                t('msgid', ['harry', 'potter']);
                expect(spy.translate).toHaveBeenCalledWith(
                    'msgid', undefined, undefined, ['harry', 'potter']);

                nt('msgid', 5, ['harry', 'potter']);
                expect(spy.translate).toHaveBeenCalledWith(
                    'msgid', 5, ['harry', 'potter']);

                loggerDep.info('message');
                expect(logger.info).toHaveBeenCalledWith('message');

                this.after(tearDown);
            });
        });
