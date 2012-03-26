var extend = require('node.extend');
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var Module = require('module');

/**
 * Load a module that will run in a sandboxed context without any access to outside code
 *
 * @param {String} file the module to load
 * @param {Object} context the context that will be attached
 * @returns {Object} the exported module
 */
global.loadModule = function loadModule(file, context) {
    context = context || {};
    extend(context, global);

    var filename = Module._resolveFilename(file, this);
    var cachedModule = Module._cache[filename];

    if (cachedModule) {
        return cachedModule.exports;
    }

    var module = new Module(filename);
    Module._cache[filename] = module;
    module.filename = filename;
    module.paths = Module._nodeModulePaths(path.dirname(filename));
    module.extension = path.extname(filename) || '.js';

    var content = fs.readFileSync(filename, 'utf8');
    content = content.replace(/^\#\!.*/, ''); // strip shebang

    var sandbox = vm.createContext(context);
    sandbox.__filename = filename;
    sandbox.__dirname = path.dirname(filename);
    sandbox.module = module;
    sandbox.global = sandbox;
    sandbox.exports = module.exports;

    // remove some stuff we don't want in the sandbox
    delete sandbox.loadModule;
    delete sandbox.process.exit;

    vm.runInNewContext(content, sandbox, filename, true);
    module.loaded = true;

    return module.exports;
};
