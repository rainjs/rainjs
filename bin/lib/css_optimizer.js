"use strict";

var path = require('path'),
    fs = require('fs'),
    util = require('../../lib/util'),
    less = require('less'),
    Promise = require('promised-io/promise');


function CssOptimizer(config) {
    this._baseConfig = {
        compress: true,
        yuicompress: true
    };

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
            var destinationPath = path.join(self._outputPath, 'components/',
                data[component].folder, '/client/css/index.min.css');
            try {
                fs.writeFileSync(destinationPath, data[component].content, 'utf8');
            } catch (ex) {
                console.log(util.format("Failed to write %s for component %s at destination %s",
                    destinationPath, component, self._outputPath) + ex.stack);
            }
        }
    }, function (err) {
        console.log(err.stack);
        //console.log(err);
    });
};

CssOptimizer.prototype._minify = function (component, cssPath) {
    var cssData = [],
        self = this,
        deferred = Promise.defer();

    util.walkSync(cssPath, ['.css'], function (filePath) {
       if(filePath.indexOf('.min.css') === -1) {
           try {
               var content = fs.readFileSync(filePath, 'utf8');
               cssData.push(content);
           } catch (ex) {
                console.log(util.format('Failed to read file %s from folder %s\n',
                   filePath, cssPath) + ex.stack);
           }
       }
    });

    cssData = cssData.join('\n');

    //console.log(cssData);
    less.render(cssData, this._baseConfig, function (err, data) {
        if(err) {
            throw new Error(err);
        }

        var cssInfo = {
            content: data,
            folder: self._components[component].folder
        };

        deferred.resolve(cssInfo);
    });

    return deferred.promise;
};

module.exports = CssOptimizer;
