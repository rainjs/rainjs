"use strict";

var path = require('path');
var fs = require('fs');
var util = require('./util');
var config = require('./configuration');
var componentsDirectories = config.server.components;
var compileTemplate = require('./registry/precompile_templates').configure;
var compileLess = require('./registry/precompile_less').configure;
var componentRegistry = require('./component_registry');
var watchingDirectories = {};
var changedFiles = {};
var pathSeparator = process.platform == 'win32' ? '\\' : '/';

function init() {
    //add server lib
    watchFiles(path.join(__dirname));

    //add all components
    for (var i = componentsDirectories.length; i--;){
        watchFiles(path.join(config.serverRoot, componentsDirectories[i]));
    }
}

/**
 * Looks for files which have the extension `html`, `js`, `css`, `less` and invokes the file to be watched for changes
 *
 * @param {String} arg1..argN Contains the string, which folder has to be checked
 * @private
 */
function watchFiles() {
    for (var i = arguments.length; i--;){
        var rootFolder = arguments[i];
        util.walkSync(rootFolder, ['.less', '.css', '.js', '.html'], function(file, folder) {
            if(watchingDirectories[folder] === undefined) {
                watch(folder, rootFolder);
            }
        });
    }
}

/**
 * Watches at the given file and invokes the related function depending on the extension of the file
 *
 * event rename is fired if a file was deleted or add
 *
 * @param {String} file Path to the file
 * @param {String} folder Path to the root folder related to the file
 * @private
 */
function watch(folder, rootFolder) {
    watchingDirectories[folder] = fs.watch(folder, function (event, file) {
        var filePath = path.join(folder, file);
        if(!path.existsSync(filePath)) {
            //file deleted clean up
            return;
        }
        var stat = fs.statSync(filePath);
        if (/*event == "change" && */(changedFiles[filePath] === undefined
                                  || changedFiles[filePath].mtime.getTime() != stat.mtime.getTime())
            ) {
            switch (path.extname(filePath)) {
                case '.html':
                    recompileTemplate(filePath, rootFolder);
                    break;
                case '.js':
                    reloadModule(filePath, rootFolder);
                    break;
                case '.less':
                    recompileCSS(filePath, rootFolder);
                    break;
                case '.css':
                    recompileCSS(filePath, rootFolder);
                    break;
            }
        }
        changedFiles[filePath] = stat;
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
    var componentFolder = file.replace(folder, '').split(pathSeparator)[1];
    fs.readFile(path.join(folder, componentFolder, 'meta.json'), function(err, filecontent) {
        var meta = JSON.parse(filecontent);
        var config = componentRegistry.getConfig(meta.id, meta.version);
        try {
            compileLess(config);
            console.info('CSS recompiled');
        } catch (ex) {
            console.info('CSS can\'t recompiled');
            console.debug(ex.stack);
        }
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
    var componentFolder = file.replace(folder, '').split(pathSeparator)[1];
    fs.readFile(path.join(folder, componentFolder, 'meta.json'), function(err, filecontent) {
        var meta = JSON.parse(filecontent);
        var config = componentRegistry.getConfig(meta.id, meta.version);
        compileTemplate(config);
        console.info('Template recompiled');
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


    var componentFolder = file.replace(folder, '').split(pathSeparator);
    if (componentFolder[2] == 'server') {
        console.info('Component module %s changed', file.replace(folder, ''));
        delete require.cache[file];
        console.log('Component module removed from cache', file.replace(folder, ''));
        return;
    }
}

/**
 * Close all watching files
 */
function closeWatchers() {
    for (var directory in watchingDirectories) {
        watchingDirectories[directory].close();
    }
}

module.exports = { initialize: init, closeWatchers: closeWatchers };
