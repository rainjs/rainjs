"use strict";

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var Handlebars = require('handlebars');
var less = require('less');
var configuration = require('../configuration');
var componentRegistry = require('../component_registry');
var cssRoute = require('../routes/css').route;
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
                        css = rewriteCssUrls(css, componentConfig);
                        var stat = fs.statSync(filePath);
                        compiledCSS[filename] = {
                            content: css,
                            lastModified: stat.mtime
                        };
                    }
                });
            } catch (ex) {
                throw new RainError('Failed to precompile css ' + filename + ' !',
                                    ex, RainError.ERROR_IO);
            }
        }
    });
}

/**
 * Rewrite the URLs in a CSS file.
 *
 * @param {String} css the css file content
 * @param {Object} componentConfig the meta.json information
 * @returns {String} the css content with the rewritten URLs
 */
function rewriteCssUrls(css, componentConfig) {
    css = css.split('\n').map(function (line) {
        if (line.indexOf('@import') == 0) {
            var matches = line.match(/(?:@import )(?:(url)?\(['"]?)(.*?)(?:['"]?\)?)/);
            if (matches && matches.length > 1) {
                var url = matches[1];
                if (url.indexOf('http://') == 0 || url.indexOf('https://') == 0) {
                    // Ignore external links.
                } else if (url.indexOf('/') == 0) {
                    // URL refers to another component.
                    var newUrl = identifyComponentFromUrl(url);
                    return line.replace(matches[0], 'url("' + newUrl + '")');
                } else {
                    var resourcesFolder = componentRegistry.getFolder(componentConfig.id,
                                                                      componentConfig.version,
                                                                      'resources', true);
                    var newUrl = resourcesFolder + '/' + url;
                    return line.replace(matches[0], 'url("' + newUrl + '")');
                }
            }
        }
        return line;
    });
    return css.join('\n');
}

/**
 * Generate a component's css link that reflects the component's latest version.
 * In case the url is not recognized as a RAIN css link, keep the original url.
 *
 * @param {String} url the url
 * @returns {String} the latest version url
 */
function identifyComponentFromUrl(url) {
    var matches = url.match(cssRoute);
    if (matches && matches.length > 3) {
        var componentId = matches[1];
        var componentVersion = matches[2];
        var cssPath = matches[3];

        componentVersion = componentRegistry.getLatestVersion(componentId, componentVersion);
        if (componentVersion) {
            return '/' + componentId + '/' + componentVersion + '/' + cssPath;
        }
    }

    return url;
}

module.exports = {
    name: "Precompiler Plugin",
    configure: configure
};
