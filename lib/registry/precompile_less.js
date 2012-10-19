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

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var less = require('less');
var componentRegistry = require('../component_registry');
var cssRoute = require('../routes/css').route;
var util = require('../util');
var logger = require('../logging').get();

/**
 * Precompiles the css / less files associated with a component.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    var cssFolder = componentConfig.paths('css', true);
    var compiledCSS = componentConfig.compiledCSS = {};

    // Read all CSS files from the css folder.
    util.walkSync(cssFolder, function (filePath, folder) {
        //remove first char / or \ witb substr(1)
        var filename = filePath.replace(cssFolder, '').substr(1);
        var type = mime.lookup(filePath);
        if (type != "text/css") {
            return;
        }

        try {
            var content = fs.readFileSync(filePath).toString();
            less.render(content, function (error, css) {
                if (error) {
                    throw new RainError('CSS parsing error at precompiling ' + filePath + '.');
                }

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
                css = rewriteCssUrls(css, componentConfig, rewriteData, filePath);
                var noRules = computeRules(css);

                // replace \ with / in order to normalize file paths on windows
                var key = filename.replace('\\', '/');
                compiledCSS[key] = {
                    content: css,
                    noRules: noRules,
                    lastModified: rewriteData.lastModified
                };
            });
        } catch (ex) {
            throw new RainError('Failed to precompile css ' + filePath + ' !',
                                ex, RainError.ERROR_IO);
        }
    });
}


/**
 * Compute the number of rules of a CSS file
 * 
 * @param {String} css the content of the css file.
 * @returns {Integer} the number of rules of the rewritten CSS file
 */
function computeRules(myCss) {
    myCss = myCss.replace(/\/\*(.|\s*)+?\*\/[\r\n]*/g, '');
    var rules = myCss.split('}');
    return (rules.length-1);
}

/**
 * Rewrite the URLs from the contents of a CSS file.
 *
 * @param {String} css the content of the css file
 * @param {Object} config the id and version for the current component
 * @param {Object} rewriteData information used to avoid cyclic imports
 * @returns {String} the css content with the rewritten URLs
 */
function rewriteCssUrls(css, config, rewriteData, path) {
     css = css.split('\n').map(function (line) {
        if (line.match(/^\s*@import/)) {
            var matches = line.match(/(?:@import (?:url)?(?:\(?['"]?)([^'"\)]+)(?:['"]?\)?)(?:[ ;]*))/);
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
    var cssFolder = config.paths('css', true);
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
