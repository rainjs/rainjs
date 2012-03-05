"use strict";

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var Handlebars = require('handlebars');
var less = require('less');
var configuration = require('../configuration');
var componentRegistry = require('../component_registry');

/**
 * Precompile the templates and css / less files for faster usage.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    precompileTemplates(componentConfig);
    precompileLess(componentConfig);
}

/**
 * Precompiles the templates associated with a component.
 *
 * @param {Object} componentConfig the meta.json information
 */
function precompileTemplates(componentConfig) {
    if (!componentConfig.views) {
        return;
    }

    var templatesFolder = componentRegistry.getFolder(componentConfig.id, componentConfig.version,
                                                      'templates', true);
    for (var viewId in componentConfig.views) {
        var viewObj = componentConfig.views[viewId];
        var filePath = path.join(templateFolder, viewObj.view);
        try {
            var content = fs.readFileSync(filePath).toString();
            viewObj.compiledTemplate = Handlebars.compile(content);
        } catch (ex) {
            throw new RainError('Failed to precompile template ' + filePath + ' !', RainError.ERR_IO);
        }
    }
}

/**
 * Precompiles the css / less files associated with a component.
 *
 * @param {Object} componentConfig the meta.json information
 */
function precompileLess(componentConfig) {
    var cssFolder = componentRegistry.getFolder(componentConfig.id, componentConfig.version,
                                                'css', true);
    var compiledCSS = componentConfig.compiledCSS = {};

    readFolderRecursive(cssFolder, function (filePath, filename) {
        var type = mime.lookup(filePath);
        if (type == "text/css") {
            try {
                var content = fs.readFileSync(filePath).toString();
                less.render(content, function (error, css) {
                    if (error) {
                        throw new RainError('CSS parsing error at precompiling ' + filePath + '.');
                    } else {
                        var stat = fs.statSync(filePath);
                        compiledCSS[filename] = {
                            content: css,
                            lastModified: stat.mtime
                        };
                    }
                });
            } catch (ex) {
                throw { message: 'Failed to precompile template ' + filename + ' !', type: 'io' };
            }
        }
    });
}

/**
 * Reads a folder recursively and calls the callback to do something with a file.
 *
 * @param {String} folder the folder that contains the required files
 * @param {Function} callback the callback
 * @private
 */
function readFolderRecursive(folder, callback) {
    var files = [];
    try {
        files = fs.readdirSync(folder);
    } catch (ex) {
        console.log('The folder', folder, 'doesn\'t exist!');
    }

    for (var i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        var filePath = path.join(folder, file);

        var stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            readFolderRecursive(filePath, callback);
        } else {
            callback(filePath, file);
        }
    }
}

module.exports = {
    name: "Precompiler Plugin",
    configure: configure
};
