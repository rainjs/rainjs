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

"use strict";

var path = require('path'),
    fs = require('fs'),
    util = require('./util'),
    config = require('./configuration'),
    componentsDirectories = config.server.components,
    compileTemplate = require('./registry/precompile_templates').configure,
    compileLess = require('./registry/precompile_less').configure,
    componentRegistry = require('./component_registry'),
    logger = require('./logging').get(),
    watchingDirectories = {},
    changedFiles = {},
    pathSeparator = process.platform == 'win32' ? '\\' : '/';

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
        if(!fs.existsSync(filePath)) {
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
            logger.info('CSS recompiled');
        } catch (ex) {
            logger.warn('CSS couldn\'t be recompiled. ' + ex.stack);
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
    logger.info(util.format('Template %s changed', file.replace(folder, '')));
    var componentFolder = file.replace(folder, '').split(pathSeparator)[1];
    fs.readFile(path.join(folder, componentFolder, 'meta.json'), function(err, filecontent) {
        var meta = JSON.parse(filecontent);
        var config = componentRegistry.getConfig(meta.id, meta.version);
        compileTemplate(config);
        logger.info('Template recompiled');
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
        logger.log(util.format('reload core module %s', file.replace(folder, '')));
        delete require.cache[file];
        return;
    }


    var componentFolder = file.replace(folder, '').split(pathSeparator);
    if (componentFolder[2] == 'server') {
        logger.info('Component module %s changed', file.replace(folder, ''));
        delete require.cache[file];
        logger.info('Component module removed from cache', file.replace(folder, ''));
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
