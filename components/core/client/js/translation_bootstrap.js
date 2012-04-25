define(function () {
    var oldExecCb = require.execCb,
        oldOnScriptLoad = require.onScriptLoad,
        oldDefine = define,
        currentDeps,
        currentCallback,
        isDummyDepAdded,
        translatedModules = {};

    // used by RequireJS for browser detection
    var isBrowser = !!(typeof window !== "undefined" && navigator && document),
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
            /^complete$/ : /^(complete|loaded)$/;

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
    };

    define.amd = oldDefine.amd;

    // onScriptLoad executes immediately after define, so currentDeps and
    // currentCallback refer to the same module as moduleName
    require.onScriptLoad = function (evt) {
        var node = evt.currentTarget || evt.srcElement;

        if (evt.type === "load" || (node && readyRegExp.test(node.readyState))) {
            if (isDummyDepAdded) {
                //remove dummy dependency
                currentDeps.pop();
            }

            var moduleName = node.getAttribute("data-requiremodule"),
                moduleRegex = /^\/([\w-]+)\/(?:(\d(?:\.\d)?(?:\.\d)?)\/)(?:js)\/(.+)/,
                matches = moduleName && moduleName.match(moduleRegex);

            //add translation and locale dependencies
            if (matches && matches[1] && matches[2] && usesTranslation(currentCallback)) {
                var component = {
                    id: matches[1],
                    version: matches[2]
                };
                currentDeps.push('raintime/translation');
                currentDeps.push('locale!' + component.id + '/' + component.version);
                translatedModules[moduleName] = component;
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
