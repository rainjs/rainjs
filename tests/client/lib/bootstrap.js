var requireConfig = {
    "debug": ('{{server.env}}' == 'production'? 'false' : 'true'),
    "baseUrl": "/",
    "paths": {
        "util": "core/js/lib/util",
        "text": "core/js/lib/require-text",
        "locale": "core/js/lib/require-locale"
    },
    "packages": [{
        "name": "raintime",
        "main": "raintime",
        "location": "core/js"
    }]
};

require.config(requireConfig);

require.execCb = function (name, callback, args, exports) {
    var module = callback.apply(exports, args);
debugger;
    if (jasmine.loadedModules.indexOf(module) === -1) {
        jasmine.loadedModules.push(module);
    }

    return module;
};
