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
    config = require('../configuration'),
    util = require('../util'),
    LEVELS = require('./logger_levels');

/**
 * Reads the configuration and creates the appenders and layouts for both platform and components.
 *
 * @name Configurator
 * @constructor
 */
function Configurator() {
    /**
     * Keeps the constructors for platform appenders.
     * @type Object
     */
    this._appenderConstructors = {};

    /**
     * Keeps the constructors for platform layouts.
     * @type Object
     */
    this._layoutConstructors = {};

    //registering predefined appenders and layouts
    this._registerModules('appenders', this._appenderConstructors);
    this._registerModules('layouts', this._layoutConstructors);
}

/**
 * A constant which indicates that a custom appender or layout is used.
 *
 * @type String
 * @constant
 */
Configurator.CUSTOM_TYPE = 'custom';

/**
 * Registers the modules found in the specified directory. It reads all the JavaScript files
 * in that folder, requires them and adds the modules to the object provided as parameter.
 *
 * @param {String} modulesPath The path in which to search for modules. This path is relative to the logging directory.
 * @param {Object} obj The object that holds the module references.
 * @throws {Error} when one of the modules throws an error when it is required
 */
Configurator.prototype._registerModules = function (modulesPath, obj) {
    var dir = path.join(__dirname, modulesPath);

    util.walkSync(dir, ['.js'], function (filePath) {
        // the errors thrown by require aren't caught intentionally
        // the error can't be logged at this stage and the developer should see the actual error
        // it is OK that this error crashes the server
        var module = require(filePath);
        var moduleType = path.basename(filePath, '.js');
        obj[moduleType] = module;
    });
};

/**
 * Initializes the appenders for a specific component or for the platform.
 *
 * @param [component] The component for which to create the appenders.
 * @param component.id The component id.
 * @param component.version The component version.
 * @returns {Appender[]} the appender list
 * @throws {RainError} when the platform level is invalid.
 */
Configurator.prototype.getAppenders = function (component) {
    if (typeof config.logger === 'undefined') {
        return [];
    }

    if (typeof LEVELS[config.logger.level] === 'undefined') {
        throw new RainError('Invalid logger level: ' + config.logger.level);
    }

    var loggerConfig, componentConfig;
    if (!component) {
        loggerConfig = config.logger;
    } else {
        // component registry is required the first time a component logger is requested
        // the component registry uses the logger so doing this earlier would trigger an error
        var componentRegistry = require('../component_registry');
        componentConfig = componentRegistry.getConfig(component.id, component.version);

        if (!componentConfig) {
            // the platform logger is already initialized when a component logger is requested
            var logger = require('./logger').get();
            logger.error('Configurator.getAppenders - Failed to get the component config for: ' +
                component.id + ';' + component.version);
            return [];
        }

        loggerConfig = componentConfig.logger;

        if (!loggerConfig) {
            return [];
        }
    }

    var appenders = [];

    for (var i = loggerConfig.appenders.length; i--;) {
        var appender = this._createAppender(loggerConfig.appenders[i], componentConfig);
        if (appender) {
            appenders.push(appender);
        }
    }

    return appenders;
};

/**
* Creates an appender. It throws errors only when creating appenders for the platform logger.
* For component loggers, it logs error messages using the platform logger.
*
* @param {Object} options The options used to configure the appender.
* @param {String} options.[level] The level to be used by the appender. If it isn't specified the platform level is used.
* @param {String} options.type The appender type.
* @param {Object} options.layout The options for the layout used by the appender.
* @param {Object} options.[params] The appender options.
* @param {Object} [componentConfig] The configuration of the component for which the appender is created.
* @returns {Appender}
* @throws {RainError} when the appender level is invalid
* @throws {RainError} when the appender type is invalid
* @throws {RainError} when layout options are empty
*/
Configurator.prototype._createAppender = function (options, componentConfig) {
   var level = options.level || config.logger.level;

   if (typeof LEVELS[level] === 'undefined') {
       throw new RainError('Invalid appender level: ' + level);
   }

   var Appender;
   if (componentConfig && options.type === Configurator.CUSTOM_TYPE) {
       Appender = require(path.join(componentConfig.paths('server', true), options.file));
   } else {
       Appender = this._appenderConstructors[options.type];
   }

   if (typeof Appender === 'undefined') {
       if (!componentConfig) { // platform logger
           throw new RainError('Invalid appender type: ' + options.type);
       } else {
           require('./logger').get().error('Failed to create appender for: ' + componentConfig.id + ';' +
               componentConfig.version + '. Invalid appender type: ' + options.type);
           return;
       }
   }

   if (typeof options.layout === 'undefined') {
       if (!componentConfig) {
           throw new RainError('No layout specified.');
       } else {
           require('./logger').get().error('Failed to create appender for: ' + componentConfig.id + ';' +
               componentConfig.version + '. No layout specified. ');
           return;
       }
   }

   var layout = this._createLayout(options.layout, componentConfig);

   if (!layout) {
       return;
   }

   try {
       return new Appender(level, layout, options.params);
   } catch (ex) {
       if (!componentConfig) {
           throw ex;
       } else {
           require('./logger').get().error('Failed to create appender for: ' + componentConfig.id + ';' +
               componentConfig.version + '.', ex);
       }
   }
};

/**
* Creates a layout. It throws errors only when creating layouts for the platform logger.
*
* @param {Object} options The options used to configure the layout.
* @param {String} options.type The layout type.
* @param {Object} options.[params] The layout options.
* @param {Object} [componentConfig] The configuration of the component for which the layout is created.
* @returns {Layout}
* @throws {RainError} when the layout type is invalid
*/
Configurator.prototype._createLayout = function (options, componentConfig) {
    var Layout;
    if (componentConfig && options.type === Configurator.CUSTOM_TYPE) {
        Layout = require(path.join(componentConfig.paths('server', true), options.file));
    } else {
        Layout = this._layoutConstructors[options.type];
    }

    if (typeof Layout === 'undefined') {
        if (!componentConfig) {
            throw new RainError('Invalid layout type: ' + options.type);
        } else {
            require('./logger').get().error('Failed to create layout for: ' + componentConfig.id + ';' +
                componentConfig.version + '. Invalid layout type: ' + options.type);
            return;
        }
   }

   try {
       return new Layout(options.params);
   } catch (ex) {
       if (!componentConfig) {
           throw ex;
       } else {
           require('./logger').get().error('Failed to create layout for: ' + componentConfig.id + ';' +
               componentConfig.version + '.', ex);
       }
   }
};

/**
 * The configurator instance.
 * @type Configurator
 */
Configurator._instance = null;

/**
 * Gets the configurator instance.
 *
 * @returns {Configurator}
 */
Configurator.get = function () {
    return Configurator._instance || (Configurator._instance = new Configurator());
};

module.exports = Configurator;
