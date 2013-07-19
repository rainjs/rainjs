"use strict";

var path = require('path'),
    fs = require('fs'),
    util = require('../../lib/util'),
    less = require('less'),
    Promise = require('promised-io/promise'),
    Handlebars = require('handlebars'),
    extend = require('node.extend');;


function CssOptimizer(config) {
    this._baseConfig = {
        compress: true,
        yuicompress: true
    };

    this._map = {};

    this._components = config.components;
    this._outputPath = config.outputPath;
    this._minfiedCSS = {};
}

CssOptimizer.prototype.run = function () {

    var self = this;
    for(var component in this._components) {
        var cssPath = path.join(this._components[component].path, 'client/css');
        try {
            this._minfiedCSS[component] = this._minify(component, cssPath);
        } catch (ex) {
            console.log(util.format("Failed to minify component %s from path %s",
                component, cssPath) + ex.stack);
        }
    }

    Promise.allKeys(this._minfiedCSS).then(function (data) {

        for(var component in data) {
            self._map[component] = {
                destination: [],
                files: []
            }
            for(var i = 0, len = data[component].length; i < len; i++) {
                var fileName;
                if (i === 0) {
                    fileName = "index.min.css";
                } else {
                    fileName = "index" + i + ".min.css";
                }

                var destinationPath = path.join(self._outputPath, 'components/',
                    data[component][i].folder, '/client/css/', fileName);

                self._map[component].destination.push(destinationPath);
                self._map[component].files.push(data[component][i].files);

                try {
                    fs.writeFileSync(destinationPath, data[component][i].content, 'utf8');
                } catch (ex) {
                    console.log(util.format("Failed to write %s for component %s at destination %s",
                        destinationPath, component, self._outputPath) + ex.stack);
                }
            }
        }

        fs.writeFileSync(path.join(self._outputPath, 'cssMaps.json'), JSON.stringify(self._map));
    }, function (err) {
        console.log(err.stack);
    });
};


CssOptimizer.prototype._computeRules = function (css) {
    css = css.replace(/\/\*(.|\s*)+?\*\/[\r\n]*/g, '');
    var rules = css.split('}');
    return rules.length - 1;
}

CssOptimizer.prototype._minify = function (component, cssPath) {
    var cssData = {},
        cssFile = 0,
        self = this,
        deferrers = [],
        generalDefer = Promise.defer();

    //var map = this._getViewsWithCss(component);

    util.walkSync(cssPath, ['.css'], function (filePath) {
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

               var noRules = self._computeRules(content);

               if(cssData[cssFile].ruleCount + noRules > 4095) {
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
        less.render(cssData[style].content, this._baseConfig, function (err, data) {
            if(err) {
                throw new Error(err);
            }

            var cssInfo = {
                content: data,
                folder: self._components[component].folder,
                files: cssData[style].files
            };

            deferred.resolve(cssInfo);
        });
    }

    Promise.all(deferrers).then(function (data) {
        generalDefer.resolve(data)
    }, function (err) {
        generalDefer.reject(err);
    })

    return generalDefer.promise;
};

CssOptimizer.prototype._getViewsWithCss = function (component) {
    for(var view in this._components[component].config.views) {
        var viewConf = this._components[component].config.views[view];
        var rootOfHTML = path.join(this._components[component].path, 'client/templates/');
        //.view

        var viewHTML = viewConf.view || view + '.html';

        var pathOfHTML = path.join(rootOfHTML, viewHTML);

        var contentHTML = fs.readFileSync(pathOfHTML, 'utf8');

        var parsedHTML = Handlebars.parse(contentHTML);

        this._inspectStatement(parsedHTML.statements);

    };
}

CssOptimizer.prototype._inspectStatement = function (statements) {
    var cssHelpers = [];

    for (var i = 0, len = statements.length; i < len; i++) {
        var statement = statements[i];

        // block helper
        if (statement.type === 'block') {
            var cssBlockHelper = this._inspectStatement(statement.program.statements);
            cssHelpers = cssHelpers.concat(cssBlockHelper);
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

            return;
            var translation = {
                msgid: paramValues[0],
                msgidPlural: paramValues[1],
                id: this._getIdValue(pairs)
            };

            cssHelpers.push(translation);
        }
    }

    return cssHelpers;
}

CssOptimizer.prototype._getPairsValues = function (pairs) {

    var values = [];

    //TODO: to be continued
    console.log(pairs);

};

module.exports = CssOptimizer;
