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
    mime = require('mime'),
    less = require('less'),
    componentRegistry = require('../component_registry'),
    cssRoute = require('../routes/css').route,
    util = require('../util'),
    logger = require('../logging').get();

/**
 * Module used to precompile the CSS / Less files for components.
 *
 * @name PrecompileLess
 * @constructor
 * @class
 */
function PrecompileLess() {
    this.name = 'Precompile Less Plugin';
}

/**
 * Precompiles the css / less files associated with a component. And saves
 * a compiled css without scope for css cross referencing and a scoped CSS
 * for faster response for none css cross referencing.
 *
 * @param {Object} componentConfig the meta.json information
 */
PrecompileLess.prototype.configure = function (componentConfig) {
    var self = this,
        cssFolder = componentConfig.paths('css', true),
        compiledCSS = componentConfig.compiledCSS = {};

    // Read all CSS files from the css folder.
    util.walkSync(cssFolder, function (filePath, folder) {
        //remove first char / or \ with substr(1)
        var filename = filePath.replace(cssFolder, '').substr(1);
        var type = mime.lookup(filePath);
        if (type !== 'text/css') {
            return;
        }

        try {
            var content = fs.readFileSync(filePath).toString();

            /**
             * importedFiles key is used to keep track of already imported files to avoid
             * cyclic imports.
             *
             * lastModified key is used to keep the last modified time from the current
             * file and possible other ones that are imported.
             */
            var rewriteData = {
                importedFiles: [filePath],
                lastModified: fs.statSync(filePath).mtime
            };
            content = self._rewriteCssUrls(filePath, content, componentConfig, rewriteData);

            less.render(content, function (err, css) {
                if (err) {
                    logger.error('CSS parsing error at precompiling ' + filePath + '.', err);
                    throw new RainError('CSS parsing error at precompiling ' + filePath + '.',
                                        RainError.ERROR_PRECONDITION_FAILED);
                }

                //css without scope for cross referencing
                var unscopedCSS = css;
                //add scope to the component;
                var componentVersion = componentConfig.version.replace(/[\.]/g, '_');
                var scope = '.' + componentConfig.id + '_' + componentVersion;
                less.render(scope + ' { ' + css + ' }', function (error, css) {
                    if (err) {
                        logger.error('CSS parsing error at scoping ' + filePath + '.', err);
                        throw new RainError('CSS parsing error at scoping ' + filePath + '.',
                                            RainError.ERROR_PRECONDITION_FAILED);
                    }

                    var ruleCount = self._computeRules(css);

                    // replace \ with / in order to normalize file paths on windows
                    var key = filename.replace('\\', '/');
                    compiledCSS[key] = {
                        unscopedCSS: unscopedCSS,
                        content: css,
                        ruleCount: ruleCount,
                        lastModified: rewriteData.lastModified
                    };
                });
            });
        } catch (err) {
            throw new RainError('Failed to precompile css ' + filePath + '! ' + err.message,
                                err.type || RainError.ERROR_IO);
        }
    });
};

/**
 * Compute the number of rules of a CSS file.
 *
 * @param {String} css the content of the css file.
 * @returns {Integer} the number of rules of the rewritten CSS file
 */
PrecompileLess.prototype._computeRules = function (css) {
    css = css.replace(/\/\*(.|\s*)+?\*\/[\r\n]*/g, '');
    var rules = css.split('}');
    return rules.length - 1;
};

/**
 * Rewrite the URLs from the contents of a CSS file.
 *
 * @param {String} the CSS file path relative to the css folder
 * @param {String} css the content of the css file
 * @param {Object} config the id and version for the current component
 * @param {Object} rewriteData information used to avoid cyclic imports
 * @returns {String} the css content with the rewritten URLs
 */
PrecompileLess.prototype._rewriteCssUrls = function (cssPath, css, config, rewriteData) {
    var self = this;

    css = css.split('\n').map(function (line) {
        if (line.match(/^\s*@import/)) {
            var matches = line.match(/(?:@import (?:(?:url\()?['"])([^'"]+)(?:['"])(?:[ ;]*))/);
            if (!matches || matches.length < 2) {
                logger.warn(util.format('Invalid CSS import statement found in component %s;%s, ' +
                                        'in file %s', config.id, config.version, cssPath));
                return '';
            }

            var url = matches[1];
            if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
                // Ignore external links.
                logger.warn(util.format('Ignored external CSS import in component %s;%s, ' +
                                        'in file %s', config.id, config.version, cssPath));
                return '';
            } else if (url.indexOf('/') === 0) {
                // URL refers to another component.
                var importedCss = self._getCssFromUrl(url, rewriteData);
                return (typeof importedCss !== 'undefined') ? importedCss : '';
            } else {
                return self._getCssFromComponent(config.id, config.version, url, rewriteData);
            }
        }

        var regex = /(?:url\(['"]?)([^'"\)]+)(?:['"]?\))/g;
        var matches;// = line.match(/(?:url\(['"]?)([^'"\)]+)(?:['"]?\))/);
        while ((matches = regex.exec(line)) != null) {
            var url = matches[1];
            if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
                // Do not rewrite external links.
                //return line;
            } else if (url.indexOf('/') === 0) {
                // Do not rewrite direct links to other components.
                //return line;
            } else {
                var newUrl = '/' + config.id + '/' + config.version + '/resources/' + url;
                line = line.replace(matches[0], 'url("' + newUrl + '")');
            }
        }

        return line;
    });

    return css.join('\n');
};

/**
 * Get a CSS file contents.
 *
 * @param {String} url the url
 * @param {Object} rewriteData information used to avoid cyclic imports
 * @returns {String|undefined} the css contents
 */
PrecompileLess.prototype._getCssFromUrl = function (url, rewriteData) {
    var matches = url.match(cssRoute);
    if (!matches || matches.length < 4) {
        return;
    }

    var componentId = matches[1],
        componentVersion = matches[2],
        cssPath = matches[3];

    componentVersion = componentRegistry.getLatestVersion(componentId, componentVersion);

    if (!componentVersion) {
        logger.error('Precompile_less: The component ' + componentId + ' does not exist!');
        return;
    }

    return this._getCssFromComponent(componentId, componentVersion, cssPath, rewriteData);
};

/**
 * Get the css contents of a file inside a component.
 *
 * @param {String} componentId the component id
 * @param {String} componentVersion the component version
 * @param {String} cssPath the css path
 * @param {Object} rewriteData information used to avoid cyclic imports
 * @returns {String|undefined} the css contents
 */
PrecompileLess.prototype._getCssFromComponent = function (componentId, componentVersion,
                                                          cssPath, rewriteData) {
    var config = componentRegistry.getConfig(componentId, componentVersion),
        cssFolder = config.paths('css', true),
        filePath = path.join(cssFolder, cssPath);

    var importedFiles = rewriteData.importedFiles;
    for (var i = importedFiles.length; i--;) {
        if (importedFiles[i] === filePath) {
            return '';
        }
    }
    importedFiles.push(filePath);

    var type = mime.lookup(filePath);
    if (type !== 'text/css' && path.extname(filePath) !== '.less') {
        return '';
    }

    try {
        var content = fs.readFileSync(filePath).toString(),
            stat = fs.statSync(filePath);

        if (rewriteData.lastModified < stat.mtime) {
            rewriteData.lastModified = stat.mtime;
        }

        return this._rewriteCssUrls(cssPath, content, config, rewriteData);
    } catch (err) {
        throw new RainError('Failed to import css ' + filePath + ' ! ' + err.message,
                            RainError.ERROR_IO);
    }
};

module.exports = new PrecompileLess();
