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

var MAX_NO_RULES = 4095;

function CssOptimizer(config) {
    this._baseConfig = {
        compress: true,
        yuicompress: true
    };

    this._map = {};

    this._components = config.components;
    this._outputPath = config.outputPath;
    this._themes = config.themes;

    this._minfiedCSS = {
        default: {}
    };

    for(var theme in this._themes) {
        if(!this._minfiedCSS[theme]) {
            this._minfiedCSS[theme] = {};
        }
    }

    this._handlebarsComponent = {};
}

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
                console.log(err);
                throw new Error(err);
            });
        })(folder);
    }
};

CssOptimizer.prototype._parseMediaQueries = function() {
    for(var component in this._components) {
        var parsedViews = this._getViewsWithCss(component);
        if(typeof parsedViews !== 'undefined') {
            this._handlebarsComponent[component] = this._getViewsWithCss(component);
        }
    }
}

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

        for(var i = 0, len = data[component].length; i < len; i++) {
            var fileName;
            if (i === 0) {
                fileName = "index.min.css";
            } else {
                fileName = "index" + i + ".min.css";
            }

            var destinationPath = path.join(this._outputPath, 'components/',
                data[component][i].folder, '/client/css/', folder, fileName);

            if(!this._map[component][destinationPath]) {
                this._map[component][destinationPath] = data[component][i].files;
            } else {
                this._map[component][destinationPath].concat(data[component][i].files);
            }

            try {
                fs.writeFileSync(destinationPath, data[component][i].content, 'utf8');
                console.log('OK ', component);
            } catch (ex) {
                console.log(util.format("Failed to write %s for component %s at destination %s",
                    destinationPath, component, this._outputPath) + ex.stack);
            }
        }
    }

    fs.writeFileSync(path.join(this._outputPath, 'cssMaps.json'), JSON.stringify(this._map));

}

CssOptimizer.prototype._computeRules = function (css) {
    css = css.replace(/\/\*(.|\s*)+?\*\/[\r\n]*/g, '');
    var rules = css.split('}');
    return rules.length - 1;
};

CssOptimizer.prototype._minify = function (component, cssPath, isTheme) {
    var cssData = {},
        cssFile = 0,
        self = this,
        isThemeFolder = false,
        deferrers = [],
        generalDefer = Promise.defer();

    //var map = this._getViewsWithCss(component);

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
           if(Object.keys(cssData).length === 0) {
               cssData[cssFile] = {
                   content: [],
                   ruleCount: 0,
                   files: []
               };
           }
           try {
               var content = fs.readFileSync(filePath, 'utf8');
               content = self._rewriteLessImport(content, path.join('components/',
                   self._components[component].folder));

               var noRules = self._computeRules(content);

               if(self._handlebarsComponent[component] &&
                   self._handlebarsComponent[component][path.basename(filePath)]) {
                   var querys = self._handlebarsComponent[component][path.basename(filePath)];
                   content = self._addQuery(content, querys);
               }

               if(cssData[cssFile].ruleCount + noRules > MAX_NO_RULES) {
                   cssFile++;
                   cssData[cssFile] = {
                       content: [content],
                       ruleCount: noRules,
                       files: [path.basename(filePath)]
                   }
               } else {
                   cssData[cssFile].ruleCount += noRules;
                   cssData[cssFile].content.push(content);
                   cssData[cssFile].files.push(path.basename(filePath));
               }

           } catch (ex) {
                console.log(util.format('Failed to read file %s from folder %s\n',
                   filePath, cssPath) + ex.stack);
           }
       }
    });

    for(var style in cssData) {
        var deferred = Promise.defer();
        deferrers.push(deferred.promise);
        cssData[style].content = cssData[style].content.join('\n');
        (function (style, deferred) {
            less.render(cssData[style].content, self._baseConfig, function (err, data) {
                if(err) {
                    console.log(err);
                    throw new Error(err);
                }

                var cssInfo = {
                    content: data,
                    folder: self._components[component].folder,
                    files: cssData[style].files
                };

                deferred.resolve(cssInfo);
            });
        })(style, deferred);
    }

    Promise.all(deferrers).then(function (data) {
        generalDefer.resolve(data)
    }, function (err) {
        generalDefer.reject(err);
    })

    return generalDefer.promise;
};

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
}

CssOptimizer.prototype._rewriteLessImport = function (content, folder) {
    var requiredLess = content.match(/@import.*"(.*\.less)?"/);
    if(requiredLess) {
        requiredLess = requiredLess[1];
    }
    content = content.replace(/@import.*"(.*\.less)?"/, '@import "' + path.join(folder, '/client/css/', requiredLess) + '"');
    return content;
}

CssOptimizer.prototype._getViewsWithCss = function (component) {
    var views = {};

    for(var view in this._components[component].config.views) {
        var viewConf = this._components[component].config.views[view];
        var rootOfHTML = path.join(this._components[component].path, 'client/templates/');
        //.view

        var viewHTML = viewConf.view || view + '.html';

        var pathOfHTML = path.join(rootOfHTML, viewHTML);

        if(fs.existsSync(pathOfHTML)) {
            var contentHTML = fs.readFileSync(pathOfHTML, 'utf8');

            var parsedHTML = Handlebars.parse(contentHTML);

            //console.log(contentHTML);

            var handlebarsView = this._inspectStatement(parsedHTML.statements);

            if (typeof handlebarsView !== 'undefined') {
                for (var css in handlebarsView) {
                    if (views[css]) {
                        views[css] = views[css].concat(handlebarsView[css]);
                    } else {
                        views[css] = handlebarsView[css];
                    }
                }
            };
            //console.log(this._inspectStatement(parsedHTML.statements));
            //views[view] = this._inspectStatement(parsedHTML.statements);
        }
    }

    if (Object.keys(views).length > 0) {
        return views;
    }
}

CssOptimizer.prototype._inspectStatement = function (statements) {
    var cssHelpers = {};

    for (var i = 0, len = statements.length; i < len; i++) {
        var statement = statements[i];

        // block helper
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
