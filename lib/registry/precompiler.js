"use strict";

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var Handlebars = require('handlebars');
var less = require('less');
var configuration = require('../configuration');
var componentRegistry = require('../component_registry');
var util = require('../util');

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
        var filePath = path.join(templatesFolder, viewObj.view);
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

    util.walkDir(cssFolder, function (filePath, filename) {
        var type = mime.lookup(filePath);
        if (type == "text/css") {
            try {
                var content = fs.readFileSync(filePath).toString();
                less.render(content, function (error, css) {
                    if (error) {
                        throw new RainError('CSS parsing error at precompiling ' + filePath + '.');
                    } else {
                        css = rewriteCssUrls(css);
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
 * Rewrite the URLs in a CSS file.
 *
 * @param {String} css the css file content
 * @returns {String} the css content with the rewritten URLs
 */
function rewriteCssUrls(css) {
    return css;
}

module.exports = {
    name: "Precompiler Plugin",
    configure: configure
};
