define(function () {
    var oldExecCb = require.execCb,
        oldOnScriptLoad = require.onScriptLoad,
        oldDefine = define,
        oldAddScriptToDom = require.addScriptToDom,
        currentDeps,
        currentCallback,
        isDummyDepAdded,
        translatedModules = {},
        useInteractive = false, //this is only for IE
        currentlyAddingScript,
        interactiveScript = null;

    // used by RequireJS for browser detection
    var isBrowser = !!(typeof window !== "undefined" && navigator && document),
        isOpera = typeof opera !== "undefined" && opera.toString() === "[object Opera]",
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
            /^complete$/ : /^(complete|loaded)$/;

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
     * Determines if the last 2 arguments of a function are t and nt
     *
     * @param {Function} the function to check
     * @returns {Boolean} true if the function uses translation
     */
    function usesTranslation(fn) {
        var argumentsRegExp = /\(([\s\S]*?)\)/,
            splitRegExp = /[ ,\n\r\t]+/,
            matches = argumentsRegExp.exec(fn.toString()),
            args = matches[1].trim().split(splitRegExp),
            len = args.length;

        return len >= 2 && args[len - 2] === 't' && args[len - 1] === 'nt';
    }

    function addTranslation(moduleName, deps, callback) {
        var moduleRegex = /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)(?:js)\/(.+)/,
            matches = moduleName && moduleName.match(moduleRegex);

        //add translation and locale dependencies
        if (matches && matches[1] && matches[2] && usesTranslation(callback)) {
            var component = {
                id: matches[1],
                version: matches[2]
            };
            deps.push('raintime/translation');
            deps.push('locale!' + component.id + '/' + component.version);
            translatedModules[moduleName] = component;
        }
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

        if (!currentDeps.length && usesTranslation(currentCallback)) {
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
                    addTranslation(def[0], def[1], def[2]);
                }
            }

            currentDeps = null;
            currentCallback = null;
        }
    };

    define.amd = oldDefine.amd;

    // onScriptLoad executes immediately after define, so currentDeps and
    // currentCallback refer to the same module as moduleName
    require.onScriptLoad = function (evt) {
        var node = evt.currentTarget || evt.srcElement;

        if (evt.type === "load" || (node && readyRegExp.test(node.readyState))) {
            interactiveScript = null;
            //all browsers except IE
            if (currentDeps && currentCallback) {
                var moduleName = node.getAttribute("data-requiremodule");
                addTranslation(moduleName, currentDeps, currentCallback);
            }

            oldOnScriptLoad(evt);
        }
    };

    require.execCb = function (name, callback, args, exports) {
        var component = translatedModules[name];
        if (component) {
            var locale = args.pop(),
                Translation = args.pop(),
                translation = Translation.get(component, locale);

            var t = function (msgId, args) {
               return translation.translate(msgId, undefined, undefined, args);
            };
            var nt = translation.translate.bind(translation);
            args.push(t, nt);
        }

        // invoke the original implementation of the function
        return oldExecCb(name, callback, args, exports);
    };
});
