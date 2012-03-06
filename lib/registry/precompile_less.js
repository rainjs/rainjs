"use strict";

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var less = require('less');
var componentRegistry = require('../component_registry');
var cssRoute = require('../routes/css').route;
var util = require('../util');

/**
 * Precompiles the css / less files associated with a component.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    var config = {
        id: componentConfig.id,
        version: componentRegistry.getLatestVersion(componentConfig.id, componentConfig.version)
    };

    var cssFolder = componentRegistry.getFolder(componentConfig.id, componentConfig.version,
                                                'css', true);
    var compiledCSS = componentConfig.compiledCSS = {};

    // Read all CSS files from the css folder.
    util.walkDir(cssFolder, function (filePath, filename) {
        var type = mime.lookup(filePath);
        if (type != "text/css") {
            return;
        }

        try {
            var content = fs.readFileSync(filePath).toString();
            less.render(content, function (error, css) {
                if (error) {
                    throw new RainError('CSS parsing error at precompiling ' + filePath + '.');
                } else {
                    var stat = fs.statSync(filePath);

                    /**
                     * importedFiles key is used to keep track of already imported files to avoid
                     * cyclic imports.
                     *
                     * lastModified key is used to keep the last modified time from the current
                     * file and possible other ones that are imported.
                     */
                    var rewriteData = {
                        importedFiles: [filePath],
                        lastModified: stat.mtime
                    };
                    css = rewriteCssUrls(css, config, rewriteData);

                    compiledCSS[filename] = {
                        content: css,
                        lastModified: rewriteData.lastModified
                    };
                }
            });
        } catch (ex) {
            throw new RainError('Failed to precompile css ' + filename + ' !',
                                ex, RainError.ERROR_IO);
        }
    });
}

/**
 * Rewrite the URLs from the contents of a CSS file.
 *
 * @param {String} css the content of the css file
 * @param {Object} config the id and version for the current component
 * @param {Object} rewriteData information used to avoid cyclic imports
 * @returns {String} the css content with the rewritten URLs
 */
function rewriteCssUrls(css, config, rewriteData) {
    css = css.split('\n').map(function (line) {
        if (line.match(/^\s*@import/)) {
            var matches = line.match(/(?:@import (?:url)?(?:\(?['"]?)([^'"\)]+)(?:['"]?\)?)(?:[ ;]*))$/);
            if (!matches || matches.length < 2) {
                return line;
            }

            var url = matches[1];
            if (url.indexOf('http://') == 0 || url.indexOf('https://') == 0) {
                // Ignore external links.
            } else if (url.indexOf('/') == 0) {
                // URL refers to another component.
                var importedCss = getCssFromUrl(url, rewriteData);
                return (typeof importedCss !== 'undefined') ? importedCss : line;
            } else {
                return getCssFromComponent(config.id, config.version, url, rewriteData);
            }
        } else {
            var matches = line.match(/(?:url\(['"]?)([^'"\)]+)(?:['"]?\))/);
            if (!matches || matches.length < 2) {
                return line;
            }

            var url = matches[1];
            if (url.indexOf('http://') == 0 || url.indexOf('https://') == 0) {
                // Ignore external links.
            } else if (url.indexOf('/') == 0) {
                // Ignore direct links to other components.
            } else {
                var resourcesFolder = componentRegistry.getFolder(config.id, config.version,
                                                                  'resources', true);
                var newUrl = '/' + config.id + '/' + config.version + '/resources/' + url;
                return line.replace(matches[0], 'url("' + newUrl + '")');
            }
        }
        return line;
    });
    return css.join('\n');
}

/**
 * Get a CSS file contents.
 *
 * @param {String} url the url
 * @param {Object} rewriteData information used to avoid cyclic imports
 * @returns {String|undefined} the css contents
 */
function getCssFromUrl(url, rewriteData) {
    var matches = url.match(cssRoute);
    if (matches && matches.length > 3) {
        var componentId = matches[1];
        var componentVersion = matches[2];
        var cssPath = matches[3];

        componentVersion = componentRegistry.getLatestVersion(componentId, componentVersion);
        if (!componentVersion) {
            return;
        }

        return getCssFromComponent(componentId, componentVersion, cssPath, rewriteData);
    }
}

/**
 * Get the css contents of a file inside a component.
 *
 * @param {String} componentId the component id
 * @param {String} componentVersion the component version
 * @param {String} cssPath the css path
 * @param {Object} rewriteData information used to avoid cyclic imports
 * @returns {String|undefined} the css contents
 */
function getCssFromComponent(componentId, componentVersion, cssPath, rewriteData) {
    var config = componentRegistry.getConfig(componentId, componentVersion);
    var cssFolder = componentRegistry.getFolder(config.id, config.version, 'css', true);
    var filePath = path.join(cssFolder, cssPath);

    var importedFiles = rewriteData.importedFiles;
    for (var i = importedFiles.length; i--;) {
        if (importedFiles[i] === filePath) {
            return '';
        }
    }
    importedFiles.push(filePath);

    var type = mime.lookup(filePath);
    if (type != "text/css") {
        return '';
    }

    try {
        var content = fs.readFileSync(filePath).toString();

        var stat = fs.statSync(filePath);
        if (rewriteData.lastModified < stat.mtime) {
            rewriteData.lastModified = stat.mtime;
        }

        return rewriteCssUrls(content, config, rewriteData);
    } catch (ex) {
        throw new RainError('Failed to import css ' + filePath + ' !', ex, RainError.ERROR_IO);
    }
}

module.exports = {
    name: "Precompile Less Plugin",
    configure: configure
};
