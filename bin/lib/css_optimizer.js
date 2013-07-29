// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of
// conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
// 3. Neither the name of The author nor the names of its contributors may be used to endorse or
// promote products derived from this software without specific prior written permission.
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
    util = require('../../lib/util'),
    less = require('less'),
    Promise = require('promised-io/promise'),
    Handlebars = require('handlebars'),
    extend = require('node.extend');

/**
 * The maximum number of rules to be included in a minified css file.
 * 4095 - is the maximum number for < IE10
 * @type {number}
 */
var MAX_NO_RULES = 4095;

/**
 * CssOptimizer module.
 * @example
 * var config = {
 *  outputPath: 'path/to/output',
 *  themes: {
 *      'themeName': 'themeFolderName'
 *   },
 *  components: {config:configValue}
 * };
 * new CssOptimizer(config);
 *
 * @param {Object} config the configuration with which to generate the minification
 * @name CssOptimizer
 * @constructor
 */
function CssOptimizer(config) {
    /**
     * Default set of rules to be applied on less.render method
     * @type {{compress: boolean, yuicompress: boolean}}
     * @private
     */
    this._baseConfig = {
        compress: true,
        yuicompress: true
    };

    /**
     * The map of components containing the path to the minified css files and the array
     * of files introduced in the minified file that is to be written in the cssMaps.json file
     * @example
     * {
     *      "component;1.0": {
     *          "/path/to/component/client/css/index.min.css": ["file1.css", "file2.css"],
     *          "/path/to/component/client/css/index1.min.css": ["file3.css", "file4.css"]
     *      }
     * }
     * @type {Object}
     * @private
     */
    this._map = {};

    /**
     * The map of components configurations for which the minification is done.
     * @type {Object}
     * @private
     */
    this._components = config.components;

    /**
     * The output path for the minified project
     * @type {String}
     * @private
     */
    this._outputPath = config.outputPath;

    /**
     * A theme map containing theme name and theme name of the folder inside the components.
     * @type {Object}
     * @example
     * {
     *      'themeName': 'themeFolderName'
     * }
     * @private
     */
    this._themes = config.themes;

    /**
     * A map of minifiedCss for default and themes
     * @type {Object}
     * @example
     * {
     *      default: {
     *          'component;1.0': [
     *              {
     *                  content: 'cssContent',
     *                  folder: 'theFolderOfCssFile',
     *                  files: ['file1.css', 'file2.css'] //the files that generated the content
     *             }
     *     },
     *     theme1: {
     *          'component;1.0': [
     *              {
     *                  content: 'cssContent',
     *                  folder: 'theFolderOfCssFile',
     *                  files: ['themeFile1.css', 'themeFile2.css']
     *              }
     *    }
     * }
     * @private
     */
    this._minfiedCSS = {
        default: {}
    };

    for(var theme in this._themes) {
        if(!this._minfiedCSS[theme]) {
            this._minfiedCSS[theme] = {};
        }
    }

    /**
     * The media query map, generated for css files that have media query rules
     * @type {Object}
     * @example
     * {
     *      'component;1.0': {
     *          'file.css': ['queryrule1', queryrule2']
     *      }
     * }
     * @private
     */
    this._mediaQueryMap = {};

}

/**
 * Runs the css minification
 *
 * @public
 * @throws {Error} if minification for a component fails.
 * @throws {Error} if the writing to a .min.css fails.
 * @throws {Error} if the reading of a css file fails.
 */
CssOptimizer.prototype.run = function () {

    var self = this;
    this._parseMediaQueries();

    for(var component in this._components) {
        try {

            for (var theme in this._minfiedCSS) {
                var isTheme = false,
                    cssPath = path.join(this._components[component].path, 'client/css');

                if(this._themes[theme]) {
                    cssPath = path.join(cssPath, './', this._themes[theme]);
                    isTheme = true;
                }

                this._minfiedCSS[theme][component] = this._minify(component, cssPath, isTheme);
            }

        } catch (ex) {
            console.log(ex);
            console.log(util.format("Failed to minify component %s from path %s",
                component, cssPath) + ex.stack);
            throw new Error(ex);
        }
    }

    for(var theme in this._minfiedCSS) {
        var folder;
        if(this._themes[theme]) {
            folder = this._themes[theme];
        }

        (function(folder) {
            Promise.allKeys(self._minfiedCSS[theme]).then(function (data) {
                self._writeFiles(data, folder);
            }, function (err) {
                console.log(err.message);
            });
        })(folder);
    }
};

/**
 * Parses the views of a component and memorates the css files and the media queries to be
 * applied on that css file
 *
 * @private
 */
CssOptimizer.prototype._parseMediaQueries = function() {
    for(var component in this._components) {
        var parsedViews = this._getMediaQuerrys(component);
        if(typeof parsedViews !== 'undefined') {
            this._mediaQueryMap[component] = this._getMediaQuerrys(component);
        }
    }
};

/**
 * Writes the minified css for a component to the desired destination in a index(1|2|..).min.css file.
 * Also in writes a ``cssMaps.json`` representing the component that contains keys representing paths
 * to the minified file and for values it contains an array of files that have been included in that
 * minified file (this is needed to be abble to split depending on the number of rules into multiple
 * min.css files.
 *
 * @example
 * {
 *      form;1.0: {
 *          "/path/to/component/client/css/index.min.css": ["file1.css", "file2.css"]
 *      }
 * }
 *
 * @param {Object} data the data of the minified css for a component
 * @param {String} [folder] optional parameter specifing a more exact folder in which you want to write the files,
 * currently this folder is used for themes
 * @private
 */
CssOptimizer.prototype._writeFiles = function (data, folder) {

    if(folder) {
        folder = folder;
    } else {
        folder = './';
    }
    for(var component in data) {
        if(!this._map[component]) {
            this._map[component] = {
            }
        }

        for(var index in data[component]) {
            var fileName;
            if (index === '0') {
                fileName = "index.min.css";
            } else {
                fileName = "index" + index + ".min.css";
            }

            var destinationPath = path.join(this._outputPath, 'components/',
                data[component][index].folder, '/client/css/', folder, fileName);

            var requestRoute = component.replace(';', '/');
            requestRoute = '/' + requestRoute;
            requestRoute = path.join(requestRoute, '/css/', folder, fileName);

            if(!this._map[component][requestRoute]) {
                this._map[component][requestRoute] = data[component][index].files;
            } else {
                this._map[component][requestRoute].concat(data[component][index].files);
            }

            try {
                fs.writeFileSync(destinationPath, data[component][index].content, 'utf8');
                console.log('OK ', component);
            } catch (ex) {
                console.log(util.format("Failed to write %s for component %s at destination %s",
                    destinationPath, component, this._outputPath) + ex.stack);
            }
        }
    }

    fs.writeFileSync(path.join(this._outputPath, 'cssMaps.json'), JSON.stringify(this._map));

};

/**
 * Computes the number of rules for a css file.
 *
 * @params {String} css the data in the css file.
 * @returns {Number} the number of css rules for that file.
 * @private
 */
CssOptimizer.prototype._computeRules = function (css) {
    //TODO: I am applying this on .less files I think it does not work properly.
    css = css.replace(/\/\*(.|\s*)+?\*\/[\r\n]*/g, '');
    var rules = css.split('}');
    return rules.length - 1;
};

/**
 * Minifies all css files from a component into a single css file. Steps over themes if flaged
 * to do so.
 *
 * @param {String} component the component name
 * @param {String} cssPath the path to where the css files are located
 * @param {Boolean} [isTheme] specifies if the location where the minification is done is a theme folder
 * @returns {Promise} the combined minified files.
 * @private
 */
CssOptimizer.prototype._minify = function (component, cssPath, isTheme) {
    var cssData = {},
        cssFile = 0,
        self = this,
        isThemeFolder = false,
        deferrers = [],
        generalDefer = Promise.defer();

    util.walkSync(cssPath, ['.css'], function (filePath) {

       if(!isTheme) {
           for(var theme in self._themes) {
               if(filePath.indexOf(self._themes[theme]) !== -1) {
                   isThemeFolder = true;
               }
           }

           if(isThemeFolder) {
               return;
           }
       }

       if(filePath.indexOf('.min.css') === -1) {

           try {
               var content = fs.readFileSync(filePath, 'utf8');
               content = self._rewriteLessImport(content, path.join('components/',
                   self._components[component].folder));

               if(self._mediaQueryMap[component] &&
                   self._mediaQueryMap[component][path.basename(filePath)]) {
                   var querys = self._mediaQueryMap[component][path.basename(filePath)];
                   content = self._addQuery(content, querys);
               }

               var deferred = Promise.defer();
               deferrers.push(deferred.promise);
               (function (cssData, component, content, file, deferred) {
                   less.render(content, self._baseConfig, function (err, data) {
                       if(err) {
                           console.log(err);
                           deferred.reject(err);
                           return;
                       }

                       var noRules = self._computeRules(content);

                       var cssInfo = {
                           content: data,
                           folder: self._components[component].folder,
                           file: file,
                           noRules: noRules
                       };

                       deferred.resolve(cssInfo);
                   });
               })(cssData, component, content, path.basename(filePath), deferred);

           } catch (ex) {
                console.log(util.format('Failed to read file %s from folder %s\n',
                   filePath, cssPath) + ex.stack);
                throw ex;
           }
       }
    });

    Promise.all(deferrers).then(function (data) {
        if(data.length > 0) {
            cssData[cssFile] = {
                content: '',
                ruleCount: 0,
                files: [],
                folder: ''
            };
        }

        for(var i = 0, len = data.length; i < len; i++) {
            var minifiedFile = data[i],
                content = minifiedFile.content;

            if(cssData[cssFile].ruleCount + minifiedFile.noRules > MAX_NO_RULES) {
                cssFile++;
                cssData[cssFile] = {
                    content: content,
                    ruleCount: minifiedFile.noRules,
                    files: [minifiedFile.file],
                    folder: minifiedFile.folder
                }
            } else {
                cssData[cssFile].ruleCount += minifiedFile.noRules;
                cssData[cssFile].content += content;
                cssData[cssFile].files.push(minifiedFile.file);
                cssData[cssFile].folder = minifiedFile.folder;
            }
        }

        generalDefer.resolve(cssData);
    }, function (err) {
        generalDefer.reject(err);
    });

    return generalDefer.promise;
};

/**
 * Mangles a content of a css file and adds the ``@media`` with rules option
 *
 * @param {String} content the content of a css file
 * @param {[String]} querys the array of query rules to be applied on the css rules.
 * @returns {String} returns the content of the css with the ``@media`` and rules applied to it.
 * @private
 */
CssOptimizer.prototype._addQuery = function (content, querys) {
    var headQuery = "@media ";

    for (var i = 0, len = querys.length; i < len; i++) {
        headQuery += querys[i];

        if(i === querys.length - 1) {
            continue;
        }

        headQuery += ", ";
    }

    content = headQuery + "{\n" + content + "}";
    return content;
};

/**
 * Rewrites the less import ``@import`` rule from a css file. It rewrites the path of the import
 * to the actual location of the file.
 *
 * @param {String} content the content of the css file in which the rewrite should be done.
 * @param {String} folder the folder in which the css file is
 * @returns {String} the content of the css file with the rewritten ``@import`` rule.
 * @private
 */
CssOptimizer.prototype._rewriteLessImport = function (content, folder) {
    var requiredLess = content.match(/@import.*"(.*\.less)?"/);
    if(requiredLess) {
        requiredLess = requiredLess[1];
    }
    content = content.replace(/@import.*"(.*\.less)?"/, '@import "' + path.join(folder, '/client/css/', requiredLess) + '"');
    return content;
};

/**
 * Gets the set of rules for media querryes for each view from the css helper inside.
 *
 * @param {String} component the component's name.
 * @returns {Object|null} If querys for a css are found than an object with css file name and the array
 * of querrys for that file that should be applied.
 * @private
 */
CssOptimizer.prototype._getMediaQuerrys = function (component) {
    var views = {};

    for(var view in this._components[component].config.views) {
        var viewConf = this._components[component].config.views[view],
            rootOfHTML = path.join(this._components[component].path, 'client/templates/'),
            viewHTML = viewConf.view || view + '.html',
            pathOfHTML = path.join(rootOfHTML, viewHTML);

        if(fs.existsSync(pathOfHTML)) {
            var contentHTML = fs.readFileSync(pathOfHTML, 'utf8'),
                parsedHTML = Handlebars.parse(contentHTML),
                handlebarsView = this._inspectStatement(parsedHTML.statements);

            if (typeof handlebarsView !== 'undefined') {
                for (var css in handlebarsView) {
                    if (views[css]) {
                        views[css] = views[css].concat(handlebarsView[css]);
                    } else {
                        views[css] = handlebarsView[css];
                    }
                }
            };
        }
    }

    if (Object.keys(views).length > 0) {
        return views;
    }
};

/**
 * Inspects the css handlebars helper statement.
 *
 * @param {Object} statements the css helper handlebar statement
 * @returns {Object|null} if found query statement returns an object containing the css file name and
 * the querry rule
 * @private
 */
CssOptimizer.prototype._inspectStatement = function (statements) {
    var cssHelpers = {};

    for (var i = 0, len = statements.length; i < len; i++) {
        var statement = statements[i];

        if (statement.type === 'block') {
            var cssBlockHelper = this._inspectStatement(statement.program.statements);
            if(typeof cssBlockHelper !== 'undefined') {
                var key = Object.keys(cssBlockHelper)[0];
                if(cssHelpers[key]) {
                    cssHelpers[key].push(cssBlockHelper[key]);
                } else {
                    cssHelpers[key] = [cssBlockHelper[key]];
                }
            }
        }

        // handlebars helper (isHelper is true if this statement has parameters)
        if (statement.type === 'mustache' && statement.isHelper) {

            var ids = [],
                helperName = statement.id.string,
                params = statement.params,
                pairs = (statement.hash && statement.hash.pairs) || [];

            if (helperName !== 'css') {
                continue;
            }

            var paramValues = this._getPairsValues(pairs);

            if(typeof paramValues !== 'undefined') {
                var key = Object.keys(paramValues)[0];
                if(cssHelpers[key]) {
                    cssHelpers[key].push(paramValues[key]);
                } else {
                    cssHelpers[key] = [paramValues[key]];
                }
            }
        }
    }

    if(Object.keys(cssHelpers).length > 0) {
        return cssHelpers;
    }

    return;
};

/**
 * Gets the path and the media query rules from the css handlebars helper.
 *
 * @param {[Object]} pairs the pairs of css handlebars helper variables.
 * @returns {Object|null} if the css file has media querys applied on it it returns an object
 * containing the name of the file as key and the media query rules as value.
 * @private
 */
CssOptimizer.prototype._getPairsValues = function (pairs) {

    var keys = {};

    var mediaQ = {};

    for(var i = 0, len = pairs.length; i < len; i++) {
        if(pairs[i].indexOf('path') !== -1) {
            keys["path"] = pairs[i][1];
        } else if(pairs[i].indexOf('media') !== -1) {
            keys['media'] = pairs[i][1];
        }
    }

    if(keys["media"]) {
        mediaQ[keys["path"].string] = keys["media"].string
        return mediaQ;
    }

    return;
};

module.exports = CssOptimizer;
