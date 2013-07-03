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
        currentDeps,
        currentCallback,
        dependencyModules = {},
        useInteractive = false, //this is only for IE
        interactiveScript = null;

    // used by RequireJS for browser detection
    var isBrowser = !!(typeof window !== "undefined" && navigator && document),
        isOpera = typeof opera !== "undefined" && opera.toString() === "[object Opera]",
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
            /^complete$/ : /^(complete|loaded)$/;

    require.load = function (context, moduleName, url) {
        oldExecCb = oldExecCb || context.execCb;
        oldOnScriptLoad = oldOnScriptLoad || context.onScriptLoad;

        context.onScriptLoad = onScriptLoad;
        context.execCb = execCb;

        var node = oldLoad(context, moduleName, url);

        if (node.attachEvent
            && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0)
            && !isOpera) {
            useInteractive = true;
        }

        return node;
    };

    define = function(name, deps, callback) {
        currentDeps = deps;
        currentCallback = callback;

        if (typeof name !== 'string') {
            currentDeps = name;
            currentCallback = deps;
        }

        if (Object.prototype.toString.call(currentDeps) !== '[object Array]') {
            currentCallback = currentDeps;
            currentDeps = [];
        }

        // when the order plugin is used the callback parameter is not a function
        if (typeof currentCallback !== 'function') {
            oldDefine(name, deps, callback);
            currentDeps = null;
            currentCallback = null;
            return;
        }

        if (typeof name === 'string') {
            modifyDependencies(name, currentDeps, currentCallback);
            oldDefine(name, currentDeps, currentCallback);
        } else {
            oldDefine(currentDeps, currentCallback);
        }

        //IE
        if (useInteractive) {
            var node = getInteractiveScript();
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

    /**
     * Prefixes component dependencies with component id and version and
     * adds special RAIN dependencies like translation and logger. It only modifies relative paths
     * not ending with .js (RequireJS module id) and starting with js/ like: js/index or
     * js/lib/file. The path js/lib/file will become id/version/js/lib/file.
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
            if (typeof dependency !== 'undefined' &&
                !require.jsExtRegExp.test(dependency) &&
                dependency.indexOf('js/') === 0) {
                deps[i] = component.id + '/' + component.version + '/' + dependency;
            }
        }
    }


    /**
     * Removes t, nt and logger from dependencies and adds special RAIN dependencies like
     * translation, locale, logger.
     *
     * @param {Object} component the component for which the module is loaded
     * @param {String} moduleName the module name
     * @param {String[]} deps the module dependencies
     * @param {Function} callback a function that is called when the module is loaded
     */
    function addDependencies(component, moduleName, deps, callback) {
        var module = {};
        module.component = component;

        ['t', 'nt', 'logger'].forEach( function(element) {
            var index = currentDeps.indexOf(element);
            if (index > -1) {
                currentDeps.splice(index, 1);
            }
            module[element] = index;
        });

        if (module.t > -1 || module.nt > -1) {
            deps.push('raintime/translation');
            deps.push('locale!' + component.id + '/' + component.version + '/' + rainContext.language);
        }

        if (module.logger > -1) {
            deps.push('raintime/logger');
        }

        dependencyModules[moduleName] = module;
    }

    function execCb(name, callback, args, exports) {
        var module = dependencyModules[name];
        if (module) {
            var Logger, Translation, locale, translation, func;

            if (module.logger > -1) {
                Logger = args.pop();
            }

            if (module.t > -1 || module.nt > -1) {
                locale = args.pop();
                Translation = args.pop();
                translation = Translation.get(module.component, locale);
            }

            // They must be inserted in reverse order
            if (module.logger > -1) {
                func = Logger.get(module.component);
                args.splice(module.logger, 0, func);
            }

            if (module.nt > -1) {
                func = translation.translate.bind(translation);
                args.splice(module.nt, 0, func);
            }

            if (module.t > -1) {
                func = function (customId, msgId, args) {
                    return translation.translate(customId, msgId, undefined, undefined, args);
                };
                args.splice(module.t, 0, func);
            }
        }
        return oldExecCb(name, callback, args, exports);
    }

    getInteractiveScript = function() {
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

    define.amd = oldDefine.amd;
});
