"use strict";

var path = require('path');
var fs = require('fs');
var util = require('./util');
var config = require('./configuration');
var componentsDirectories = config.server.components;
var compileTemplate = require('./registry/precompile_templates').configure;
var compileLess = require('./registry/precompile_less').configure;
var componentRegistry = require('./component_registry');

//add server lib
watchFiles(path.join(__dirname));

//add all components
for (var i = componentsDirectories.length; i--;){
    watchFiles(path.join(config.serverRoot, componentsDirectories[i]));
}

/**
 * Looks for files which have the extension `html`, `js`, `css`, `less` and invokes the file to be watched for changes
 *
 * @param {String} arg1..argN Contains the string, which folder has to be checked
 * @private
 */
function watchFiles() {
    for (var i = arguments.length; i--;){
        var folder = arguments[i];
        util.walkSync(folder, ['.less', '.css', '.js', '.html'], function(file) {
            watch(file, folder);
        });
    }
}

/**
 * Watches at the given file and invokes the related function depending on the extension of the file
 *
 * @param {String} file Path to the file
 * @param {String} folder Path to the root folder related to the file
 * @private
 */
function watch(file, folder) {
    fs.watchFile(file, function (curr, prev) {
        if (curr.mtime.getTime() != prev.mtime.getTime()) {
            switch (path.extname(file)) {
                case '.html':
                    recompileTemplate(file, folder);
                    break;
                case '.js':
                    reloadModule(file, folder);
                    break;
                case '.less':
                    recompileCSS(file, folder);
                    break;
                case '.css':
                    recompileCSS(file, folder);
                    break;
            }
        }
    });
}


/**
 * Recompiles css files if the file changes.
 *
 * @param {String} file Path to the css file
 * @param {String} folder Path to the root folder where the components are located
 * @private
 */
function recompileCSS(file, folder) {
    console.info('CSS %s changed', file.replace(folder, ''));
    var componentFolder = file.replace(folder, '').split('/')[1];
    fs.readFile(path.join(folder, componentFolder, 'meta.json'), function(err, filecontent) {
        var meta = JSON.parse(filecontent);
        var config = componentRegistry.getConfig(meta.id, meta.version);
        compileLess(config);
        console.info('CSS %s new precompiled');
    });
}

/**
 * Recompiles component templates if the file changes.
 *
 * @param {String} file Path to the template
 * @param {String} folder Path to the root folder where the components are located
 * @private
 */
function recompileTemplate(file, folder) {
    console.info('Template %s changed', file.replace(folder, ''));
    var componentFolder = file.replace(folder, '').split('/')[1];
    fs.readFile(path.join(folder, componentFolder, 'meta.json'), function(err, filecontent) {
        var meta = JSON.parse(filecontent);
        var config = componentRegistry.getConfig(meta.id, meta.version);
        compileTemplate(config);
        console.info('Template %s new precompiled');
    });
}

/**
 * Removes core and component modules from cache if the file changes.
 *
 * @param {String} file Path to the module
 * @param {String} folder Path to the root folder which the file contains
 * @private
 */
function reloadModule(file, folder) {
    if (folder == path.join(__dirname)) {
        /**
         * BETA STATUS FOR CORE MODULES
         * MAYBE UNKNOWN MEMORY LEAKS
         */
        console.log('reload core module %s', file.replace(folder, ''));
        delete require.cache[file];
        return;
    };


    var componentFolder = file.replace(folder, '').split('/');
    if (componentFolder[2] == 'server') {
        console.info('Component module %s changed', file.replace(folder, ''));
        delete require.cache[file];
        console.log('Component module removed from cache', file.replace(folder, ''));
        return;
    }
}
