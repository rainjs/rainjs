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

define(function () {
    var oldExecCb,
        oldOnScriptLoad,
        oldDefine = define,
        oldLoad = require.load,
        oldAddScriptToDom = require.addScriptToDom,
        currentDeps,
        currentCallback,
        isDummyDepAdded,
        dependencyModules = {},
        useInteractive = false, //this is only for IE
        currentlyAddingScript,
        interactiveScript = null;

    // used by RequireJS for browser detection
    var isBrowser = !!(typeof window !== "undefined" && navigator && document),
        isOpera = typeof opera !== "undefined" && opera.toString() === "[object Opera]",
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
            /^complete$/ : /^(complete|loaded)$/;

    require.load = function (context, moduleName, url) {
        oldExecCb = oldExecCb || context.execCb;
        oldOnScriptLoad = oldOnScriptLoad || context.onScriptLoad;

        // onScriptLoad executes immediately after define, so currentDeps and
        // currentCallback refer to the same module as moduleName
        function onScriptLoad(evt) {
            var node = evt.currentTarget || evt.srcElement;

            if (evt.type === "load" || (node && readyRegExp.test(node.readyState))) {
                interactiveScript = null;
                //all browsers except IE
                if (currentDeps && currentCallback) {
                    var moduleName = node.getAttribute("data-requiremodule");
                    modifyDependencies(moduleName, currentDeps, currentCallback);
                }

                oldOnScriptLoad(evt);
            }
        }

        function execCb(name, callback, args, exports) {
            var module = dependencyModules[name];
            if (module) {
                //console.log(name);
                //for (var k in args) {
                //    console.log(k, args[k]);
                //}
                var Logger, Translation, locale, translation,
                    loggerIndex = module.loggerIndex,
                    tIndex = module.tIndex,
                    ntIndex = module.ntIndex;

                if (loggerIndex > -1) {
                    Logger = args.pop();
                }

                if (tIndex > -1 || ntIndex > -1) {
                    locale = args.pop();
                    Translation = args.pop();
                    translation = Translation.get(module.component, locale);
                }

                if (tIndex > -1) {
                    args[tIndex] = function (msgId, args) {
                        return translation.translate(msgId, undefined, undefined, args);
                    };
                }

                if (ntIndex > -1) {
                    args[ntIndex] = translation.translate.bind(translation);
                }

                if (loggerIndex > -1) {
                    args[loggerIndex] = Logger.get(module.component);
                }
            }
            // console.log(oldExecCb);
            // invoke the original implementation of the function
            return oldExecCb(name, callback, args, exports);
        }

        context.onScriptLoad = onScriptLoad;
        context.execCb = execCb;

        oldLoad(context, moduleName, url);
    };

    require.addScriptToDom = function (node) {
        currentlyAddingScript = node;

        if (node.attachEvent
            && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code]') < 0)
            && !isOpera) {
            useInteractive = true;
        }

        oldAddScriptToDom(node);

        currentlyAddingScript = null;
    };

    function getInteractiveScript() {
        var scripts, i, script;
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        scripts = document.getElementsByTagName('script');
        for (i = scripts.length - 1; i > -1 && (script = scripts[i]); i--) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        }

        return null;
    }

    /**
     * Check if a controller needs to have inserted special RAIN functions (t, nt, logger).
     *
     * @param {Function} the controller function
     * @returns {Boolean} true if one of the special parameter names is detected
     */
    function hasDependencies(fn) {
        var argumentsRegExp = /\(([\s\S]*?)\)/,
        splitRegExp = /[ ,\n\r\t]+/,
        callBackMatches = argumentsRegExp.exec(fn.toString());

        if (!callBackMatches || !callBackMatches[1]) {
            return false;
        }

        var args = callBackMatches[1].trim().split(splitRegExp);
        return args.indexOf('t') > -1 || args.indexOf('nt') > -1 || args.indexOf('logger') > -1;
    }

    /**
     * Prefixes component dependencies with component id and version and
     * adds special RAIN dependencies like translation and logger.
     *
     * @param {String} moduleName the module name
     * @param {String[]} deps the module dependencies
     * @param {Function} callback a function that is called when the module is loaded
     */
    function modifyDependencies(moduleName, deps, callback) {
        var moduleRegex = /^\/?([\w-]+)\/(\d(?:\.\d)?(?:\.\d)?)\/js\/(.+)/,
            matches = moduleName && moduleName.match(moduleRegex);

        if (!matches || !matches[1] || !matches[2]) {
            return;
        }

        var component = {
            id: matches[1],
            version: matches[2]
        };

        resolveDependencyPaths(component, deps);
        addDependencies(component, moduleName, deps, callback);
    }

    /**
     * Prefixes dependencies with component id and version. It only modifies relative paths not
     * ending with .js (RequireJS module id) and starting with js/ like: js/index or js/lib/file.
     * The path js/lib/file will become id/version/js/lib/file.
     *
     * @param {Object} component the component (id, version) for which the module is loaded
     * @param {String[]} deps the module dependencies
     */
    function resolveDependencyPaths(component, deps) {
        for (var i = 0, len = deps.length; i < len; i++) {
            var dependency = deps[i];

            // require.jsExtRegExp is defined in RequireJS and tests that a string is a regular
            // path and not a module ID. See http://requirejs.org/docs/api.html#jsfiles for more
            // details.
            if (!require.jsExtRegExp.test(dependency) && dependency.indexOf('js/') === 0) {
                deps[i] = component.id + '/' + component.version + '/' + dependency;
            }
        }
    }

    /**
     * Adds special RAIN dependencies like translation and logger.
     *
     * @param {Object} component the component for which the module is loaded
     * @param {String} moduleName the module name
     * @param {String[]} deps the module dependencies
     * @param {Function} callback a function that is called when the module is loaded
     */
    function addDependencies(component, moduleName, deps, callback) {
        var argumentsRegExp = /\(([\s\S]*?)\)/,
        splitRegExp = /[ ,\n\r\t]+/,
        callBackMatches = argumentsRegExp.exec(callback.toString());

        if (!callBackMatches || !callBackMatches[1]) {
            return;
        }

        var args = callBackMatches[1].trim().split(splitRegExp);
        // console.log(args)

        var tIndex = args.indexOf('t'),
            ntIndex = args.indexOf('nt'),
            loggerIndex = args.indexOf('logger');

        if (tIndex > -1 || ntIndex > -1) {
            deps.push('raintime/translation');
            deps.push('locale!' + component.id + '/' + component.version + '/' + rainContext.language);
        }

        if (loggerIndex > -1) {
            deps.push('raintime/logger');
        }

        dependencyModules[moduleName] = {
            component: component,
            tIndex: tIndex,
            ntIndex: ntIndex,
            loggerIndex: loggerIndex
        };
    }

    define = function (name, deps, callback) {
        currentDeps = deps;
        currentCallback = callback;
        isDummyDepAdded = false;

        if (typeof name !== 'string') {
            currentDeps = name;
            currentCallback = deps;
        }

        if (Object.prototype.toString.call(currentDeps) !== '[object Array]') {
            currentCallback = currentDeps;
            currentDeps = [];
        }

        //when the order plugin is used the callback parameter is not a function
        if (typeof currentCallback !== 'function') {
            oldDefine(name, deps, callback);
            currentDeps = null;
            currentCallback = null;
            return;
        }

        if (!currentDeps.length && hasDependencies(currentCallback)) {
            //this is a dummy dependency used to let RequireJS know that this isn't
            //a CommonJS module
            currentDeps.push('dummy');
            isDummyDepAdded = true;
        }

        if (typeof name === 'string') {
            oldDefine(name, currentDeps, currentCallback);
        } else {
            oldDefine(currentDeps, currentCallback);
        }

        if (isDummyDepAdded) {
            //remove dummy dependency
            currentDeps.pop();
        }

        //IE
        if (useInteractive) {
            var node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute("data-requiremodule");
                }
                context = require.s.contexts[node.getAttribute("data-requirecontext")];
                if (context && context.defQueue.length > 0) {
                    var def = context.defQueue[context.defQueue.length - 1];
                    modifyDependencies(def[0], def[1], def[2]);
                }
            }

            currentDeps = null;
            currentCallback = null;
        }
    };

    define.amd = oldDefine.amd;
});
