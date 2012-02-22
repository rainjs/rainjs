/*
 * Copyright (c) 2011, Claus Augusti <claus@formatvorlage.de> All rights
 * reserved. Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer. Redistributions in binary
 * form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided
 * with the distribution. Neither the name of the <organization> nor the names
 * of its contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission. THIS SOFTWARE IS
 * PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
 * EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 * OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

exports.ComponentContainer = ComponentContainer;
exports.WebComponent = WebComponent;

var mod_fs = require('fs');
var mod_tagmanager = require('./tagmanager.js');
var Renderer = require('./renderer.js').Renderer;
var mod_path = require('path');
var mod_url = require('url');
var modIntentsRegistry = require("./intents/intents_registry");
var modIntentsResolver = require("./intents/intents_resolver");
var logger = require('./logger.js').getLogger(mod_path.basename(module.filename)), mod_events = require('events');
var mod_util = require('util');
var modSocket = require("socket.io");
var modSocketsFactory = require("./sockets_container");
var modSocketHandler = require("./intents/intents_socket_handler");
var mod_sys = require('sys');

/**
 * Component Container, Manager, Factory, whatever. All module related things
 * must belong to us. Todos: download component descriptors from remote web
 * component hosts as resources.
 */
function ComponentContainer(resourcemanager) {

    this.resourcemanager = resourcemanager;
    this.componentMap = {};

    /**
     * The versions for each component in ascending order.
     *
     * @type {Object}
     * @private
     * @memberOf ComponentContainer#
     */
    this.versions = {};

    this._intentsRegistry = new modIntentsRegistry.IntentsRegistry();
    this._intentsResolver = new modIntentsResolver.IntentsResolver(this, this._intentsRegistry);
    this._socketsContainer = new modSocketsFactory.SocketsContainer();

    this.scanComponentFolder();

    this._registerCoreSocketHandlers();
}

ComponentContainer.DEFAULT_VIEW = '/htdocs/main.html';
ComponentContainer.COMPONENT_PROTOCOL = 'webcomponent://';
ComponentContainer.COMPONENT_METAFILE = 'meta.json';
ComponentContainer.COMPONENT_ROOT = Server.conf.server.componentPath;

function getComponentX(opt) {
    var self = opt.self;
    var componentName = opt.componentName;
    var viewPath = opt.viewPath;
    var req = opt.req;
    var mod_authorization = require('./authorization');

    var componentId = Server.conf.errorComponent.name;
    var version = self.getLatestVersion(componentId, version);
    componentId += ";" + version;

    var requestedComponentVersion = self.getLatestVersion(componentName, version)
    // check component exists
    if (requestedComponentVersion) {
        var requestedComponentId = componentName + ";" + requestedComponentVersion;
        var viewExits = self.getViewByViewpath(self.componentMap[requestedComponentId], viewPath);
        // check view exists
        if (viewExits) {
            var createSecurityContext = function(preferences) {
                var securityContext = {};

                securityContext = {
                    user: preferences.user
                };

                // mod_util.freezeObject(securityContext);

                return securityContext;
            }

            // check permissions

            var permissions = [];
            var configuration = self.componentMap[requestedComponentId];
            var requiredView = viewExits;

            // Add component permissions.
            if (configuration.permissions) {
                permissions = permissions.concat(configuration.permissions);
            }
            // Add view permissions.
            if (requiredView.permissions) {
                permissions = permissions.concat(requiredView.permissions);
            }

            var securityContext = createSecurityContext({
                user: req.session && req.session.user
            });

            var dynamicConditions = [];
            if (configuration.dynamicConditions && configuration.dynamicConditions._component) {
                dynamicConditions.push(configuration.dynamicConditions._component);
            }
            if (configuration.dynamicConditions && configuration.dynamicConditions[view]) {
                dynamicConditions.push(configuration.dynamicConditions[view]);
            }

            if (mod_authorization.authorize(securityContext, permissions, dynamicConditions) === false) {

                viewPath = '/htdocs/401.html';
            } else {
                componentId = requestedComponentId;
            }
        } else {
            viewPath = '/htdocs/404.html';
        }
    } else {
        viewPath = '/htdocs/404.html';
    }

    return {
        componentId: componentId,
        viewPath: viewPath
    };
}

ComponentContainer.prototype.handleViewRequest = function(req, res, tagFactory) {
    var parse = mod_url.parse(req.url), query = req.query, outputMode, data = {}, self = this, key;
    var componentName = req.params ? req.params[0] : 'exception';
    var viewPath = req.params ? req.params[1] : '/htdocs/' + req.statusCode + '.html';

    console.time('render');
    for (key in query) {
        data['req_' + key] = query[key];
    }

    if (query['rain.output']) {
        outputMode = query['rain.output'];
    } else if (req.headers['accept']) {
        var types = req.headers['accept'].split(',');
        var preftype = types[0];
        if (preftype == 'text/json') {
            outputMode = 'json';
        } else {
            outputMode = 'html';
        }
    } else {
        outputMode = 'html';
    }

    var componentConf = getComponentX({
        self: this,
        componentName: componentName,
        viewPath: viewPath,
        req: req
    });
    var component = this.createComponent(componentConf.componentId);

    component.initialize(componentConf.viewPath, outputMode, data, req, res, undefined, tagFactory);

    component.once('rendered', function(component) {
        var renderer = component.renderer, responseData, contentType;

        if (renderer.state == Renderer.STATES.RENDERED) {
            switch (renderer.mode) {
                case 'html':
                    contentType = 'text/html';
                    responseData = renderer.renderresult.content;
                    break;
                case 'json':
                default:
                    contentType = 'application/json';
                    responseData = JSON.stringify(renderer.renderresult);
            }

            res.setHeader('Content-Type', contentType + '; charset=UTF-8');
            res.setHeader('Content-Length', responseData.length);
            res.end(responseData, 'utf8');
            console.timeEnd('render');
        }
    });
};

/**
 * Returns the latest version for a component. This method also supports
 * specifying version fragments in the second optional parameter. This means
 * that if the provided version is "1", it will return the latest version that
 * has "1" as its major version (like "1.8.5"). You can also specify an exact
 * version in the fragment. If the component isn't found, it returns undefined.
 * Also, if you provide a fragment that it is too big, it will return undefined
 * (like 3.2 and the latest version is 2.5.3).
 *
 * @param {String} componentId the id of the component
 * @param {String} [fragment] a version fragment
 * @returns {String} the latest version of the component of undefined if it
 *          isn't found
 */
ComponentContainer.prototype.getLatestVersion = function(componentId, fragment) {
    var versions = this.versions[componentId];

    if (!versions) {
        return;
    }

    if (typeof fragment === 'undefined') {
        return versions[versions.length - 1].versionStr;
    }

    fragment = getVersionParts(fragment, true);

    // binary search
    var min = 0;
    var max = versions.length - 2; // mid + 1 must always exist
    while (min <= max) {
        var mid = Math.floor((min + max) / 2);
        var left = compareVersions(versions[mid], fragment);
        var right = compareVersions(versions[mid + 1], fragment);

        if (left <= 0 && right > 0) {
            if (isCompatible(versions[mid], fragment)) {
                return versions[mid].versionStr;
            }

            return;
        }

        if (left < 0) {
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }

    if (isCompatible(versions[versions.length - 1], fragment)) {
        return versions[versions.length - 1].versionStr;
    }

    return;
}

/**
 * Compares two versions and returns 1 if version1 is bigger than version2, 0 if
 * they are equal or -1 if version1 is smaller than version2.
 *
 * @param {Object} version1 the first version to compare
 * @param {Object} version2 the second version to compare
 * @returns {Number} the result of the comparison
 * @private
 * @memberOf ComponentContainer#
 */
function compareVersions(version1, version2) {
    var majorSign = compareNumbers(version1.major, version2.major);
    if (majorSign !== 0) {
        return majorSign;
    }

    var minorSign = compareNumbers(version1.minor, version2.minor);
    if (minorSign !== 0) {
        return minorSign;
    }

    return compareNumbers(version1.micro, version2.micro);
}

/**
 * Compares two numbers and returns 1 if n1 is bigger than n2, 0 if they are
 * equal or -1 if n1 is smaller than n2.
 *
 * @param {Number} n1 the first number to compare
 * @param {Number} n2 the second number to compare
 * @returns {Number} the result of the comparison
 * @private
 * @memberOf ComponentContainer#
 */
function compareNumbers(n1, n2) {
    if (n1 === n2) {
        return 0;
    } else if (n1 < n2) {
        return -1;
    } else {
        return 1;
    }
}

/**
 * Determines if a version is compatible with a provided fragment. They are
 * compatible if the numbers specified in the fragment are the same with the
 * ones in the version (like 1 and 1.8.2 or 2.6 and 2.6.3).
 *
 * @param {Object} version the version to be checked
 * @param {Object} fragment the version fragment against which the version
 *            should be checked
 * @returns {Boolean} the result of the compatibility checks
 * @private
 * @memberOf ComponentContainer#
 */
function isCompatible(version, fragment) {
    if (fragment.major === Infinity) {
        return true;
    }

    if (version.major === fragment.major) {
        if (fragment.minor === Infinity) {
            return true;
        }

        if (version.minor === fragment.minor) {
            if (fragment.micro === Infinity) {
                return true;
            }

            if (version.micro === fragment.micro) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Parses a version and returns an object containing the parts and the original
 * version string. For fragments, an unspecified part is Infinity because in
 * this case we need the latest version.
 *
 * @param {String} version the version to be parsed
 * @param {Boolean} [isFragment] the type of the version: fragment or full
 *            version
 * @returns {Object} the parsed version
 * @private
 * @memberOf ComponentContainer#
 */
function getVersionParts(version, isFragment) {
    var versionParts = version.split('.');
    var major = parseInt(versionParts[0]);
    var minor = parseInt(versionParts[1]);
    var micro = parseInt(versionParts[2]);

    return {
        major: !isNaN(major) ? major : (isFragment ? Infinity : 0),
        minor: !isNaN(minor) ? minor : (isFragment ? Infinity : 0),
        micro: !isNaN(micro) ? micro : (isFragment ? Infinity : 0),
        versionStr: version
    }
}

/**
 * Method used to return all views configuration items that match a certain
 * filter.
 *
 * @param {String} filter This is the current filter used for obtaining views.
 * @example type="dashboard"
 * @return {Array} A list of view configuration dictionaries.
 */
ComponentContainer.prototype.getViewsByFilter = function(filter) {
    if (filter.indexOf("=") == -1) {
        throw new Error("Currently we only support simple filters: viewAttribute=value " + "----> Given " + filter);
    }

    var viewsToReturn = [];

    for ( var key in this.componentMap) {
        var views = this.componentMap[key].views;

        for ( var i in views) {
            var viewConfig = views[i];

            var tmp = filter.split("=");
            var filterCol = tmp[0];
            var filterValue = tmp[1];

            if (viewConfig[filterCol]) {
                if ((viewConfig[filterCol] instanceof Array) && viewConfig[filterCol].indexOf(filterValue) != -1) {
                    viewConfig.moduleUrl = this.componentMap[key].url;
                    viewsToReturn.push(viewConfig);
                } else if (viewConfig[filterCol] == filterValue) {
                    viewsToReturn.push(viewConfig);
                }
            }
        }
    }

    return viewsToReturn;
};

function WebComponent(config, componentcontainer, resourcemanager) {
    this.config = config;
    this.componentcontainer = componentcontainer;
    this.resourcemanager = resourcemanager;
    this.params = {};
}
mod_util.inherits(WebComponent, mod_events.EventEmitter);

WebComponent.prototype.initialize = function(viewpath, outputMode, data, req, res, element, tagFactory) {
    var self = this, controllerpath = mod_path.join(Server.conf.server.serverRoot, this.config.url, 'controller', 'js',
                                                    viewpath + '.js');
    logger.debug('check for server-side view controller ' + controllerpath);

    if (!req) {
        this.params = {};
    } else if (req.query) {
        this.params = req.query;
    }

    var path = this.componentcontainer.getViewUrl(this.config, viewpath);
    try {
        this.controller = require(controllerpath);
        this.controller.handleRequest(req, res);
    } catch (exception) {
        logger.debug('controller not found');
    }
    this.tagmanager = new mod_tagmanager.TagManager(this.config.taglib);

    self.renderer = new Renderer({
        component: this,
        url: path,
        mode: outputMode,
        element: element,
        data: data,
        tagfactory: tagFactory,
        req: req,
        res: res
    });

    self.renderer.on('stateChanged', function(renderer) {
        if (renderer.state == Renderer.STATES.RENDERED) {
            self.emit('rendered', self);
        }
    });
};

/**
 * Adds a tag item to the current list of tags for current component.
 *
 * @param {Object} tag the tag object
 */
WebComponent.prototype.addTagLib = function(tag) {
    var tagList = this.tagmanager.getTagList();
    for ( var i = 0, l = tagList.length; i < l; i++) {
        var t = tagList[i];
        if (t.namespace === tag.namespace && t.selector === tag.selector && t.module === tag.module
            && t.view === tag.view) {
            return;
        }
    }
    this.tagmanager.addTag(tag);
};

ComponentContainer.prototype.createComponent = function(componentId) {
    var componentConfig = this.getConfiguration(componentId), component = new WebComponent(componentConfig, this,
                                                                                           this.resourcemanager);
    return component;
};

ComponentContainer.prototype.handleControllerRequest = function(req, res) {
    var component = req.params[0], controller = req.params[1], method = req.method.toLowerCase(), mp = mod_path
            .join(ComponentContainer.COMPONENT_ROOT, component, 'controller', controller);

    mod_path.exists(mp, function(exists, err) {
        if (exists) {
            var module = require(mp);
            if (module[method]) {
                var handlerresponse = module[method](req, res);
            } else {
                res.writeHead(404, {
                    'Content-Type': 'text/plain'
                });
                res.end('HTTP method not supported');
            }
        } else {
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            res.end('unknown component ' + component);
        }
    });
};

/**
 * Scans the COMPONENT_ROOT folder for component folders, reads the meta file
 * and registers the component. Called automatically upon load.
 */
ComponentContainer.prototype.scanComponentFolder = function() {
    var p, self = this, dir = mod_fs.readdirSync(ComponentContainer.COMPONENT_ROOT), socketsRegister = new modSocketsFactory.SocketsRegistration(
                                                                                                                                                 this._socketsContainer);

    dir.forEach(function(file) {
        if (file.indexOf('_') == 0) {
            return;
        }

        var path = mod_path.join(ComponentContainer.COMPONENT_ROOT, file);

        if (!mod_fs.statSync(path).isDirectory()) {
            return;
        }

        p = mod_path.join(ComponentContainer.COMPONENT_ROOT, file, ComponentContainer.COMPONENT_METAFILE);

        var config = JSON.parse(mod_fs.readFileSync(p).toString());

        var namespaceBase = "/" + config.id + "-" + config.version;

        socketsRegister.registerModuleSocketHandlers(path, namespaceBase);

        self.registerComponent(config);
        self._intentsRegistry.registerIntents(config);
    });
};

/**
 * Method used to register all core socket handlers of RAIN. A socket handler is
 * an instance of class SocketsHandler.
 *
 * @see sockets_container module
 */
ComponentContainer.prototype._registerCoreSocketHandlers = function() {
    logger.debug("Registering RAIN core socket handlers.");

    var intentsHandler = new modSocketHandler.SocketIntentsHandler(this._intentsResolver);

    this._socketsContainer.addSocketHandler(intentsHandler);
};

/**
 * Returns the local HTTP path to a view resource, that is the local component
 * path plus the view url. [TBD] this must not be mixed up with the view id
 * introduced by Radu's code
 */
ComponentContainer.prototype.getViewUrl = function(moduleConfig, view) {
    var view = view || ComponentContainer.DEFAULT_VIEW;
    if (moduleConfig.url.indexOf('http://') > -1) {
        return moduleConfig.url;
    } else {
        return mod_path.join(moduleConfig.url, view);
    }
};

/**
 * Return the view identified by the view id.
 *
 * @param {Object} moduleConfig the component configuration
 * @param {String} viewId the view id
 * @returns {Object|undefined} the view with the specified id
 */
ComponentContainer.prototype.getViewByViewId = function(moduleConfig, viewId) {
    if (!moduleConfig.views) {
        return;
    }

    for ( var i = 0, l = moduleConfig.views.length; i < l; i++) {
        var view = moduleConfig.views[i];
        if (view.viewid == viewId) {
            return view;
        }
    }
};

/**
 * Return the view identified by the view id.
 *
 * @param {Object} componentConfig the component configuration
 * @param {String} viewPath the view path
 * @returns {Object|null} the view
 */
ComponentContainer.prototype.getViewByViewpath = function(componentConfig, viewPath) {
    if (!viewPath) {
        new Error('viewPath is required!');
        return null;
    }

    var view = null;

    componentConfig.views.forEach(function(item) {
        if (item.view == viewPath) {
            view = item;
        }
    });

    if (view === null) {
        new Error('View with the viewPath "' + viewPath + '" doesn\'t exists!');
        return null;
    }
    return view;
}

/**
 * Return the local url of the view identified by view id.
 */
ComponentContainer.prototype.getViewUrlByViewId = function(componentConfig, viewId) {
    var view;

    if (!componentConfig.views && viewId) {
        throw new Error("View " + viewId + " is not defined.");
    }

    componentConfig.views.forEach(function(item) {
        if (item.viewid == viewId) {
            view = item;
        }
    });

    if (!view) {
        throw new Error("View " + viewId + " is not defined.")
    }

    if (componentConfig.url.indexOf("http://") > -1) {
        return componentConfig.url;
    } else {
        return mod_path.join(componentConfig.url, view.view);
    }
};

/**
 * Returns the component configuration object related to the supplied component
 * id. The module id must be of full form <component name>;<version>
 *
 * @param {String} componentId component id
 * @return {ComponentConfiguration} component configuration object
 */
ComponentContainer.prototype.getConfiguration = function(componentId) {
    if (!this.componentMap[componentId]) {
        throw new Error('Component ' + componentId + ' not found');
    }
    return this.componentMap[componentId];
};

/**
 * Register a component by the supplied component configuration object. The
 * configuration object must contain 'id' and 'url' properties, otherwise it is
 * rejected.
 *
 * @param {ComponentConfiguration} conf component configuration object
 */
ComponentContainer.prototype.registerComponent = function(conf) {
    if (!conf.id || !conf.url || !(/^(\d+\.)?(\d+\.)(\d+)$/.test(conf.version))) {
        logger.warn('Component ' + JSON.stringify(conf) + ' could not be registered');
        return;
    }
    logger.debug('register component ' + conf.id + ';' + conf.version);

    var conditionsPath = mod_path.join(Server.conf.server.serverRoot, conf.url, 'authorization', 'dynamic.js');

    try {
        conf.dynamicConditions = require(conditionsPath);
    } catch (exception) {
        // nothing should happen if the dynamic.js doesn't exist, since it is
        // optional
    }

    this.componentMap[conf.id + ';' + conf.version] = conf;
    updateVersions(this, conf);
};

/**
 * Updates the versions list for the specified component. It ensures that the
 * list is always sorted.
 *
 * @param {ComponentContainer} self the ComponentContainer instance
 * @param {Object} conf the configuration for the component
 * @private
 * @memberOf ComponentContainer#
 */
function updateVersions(self, conf) {
    var id = conf.id;
    var version = getVersionParts(conf.version, false);
    if (typeof self.versions[id] === 'undefined') {
        self.versions[id] = [];
    }
    var versions = self.versions[id];

    for ( var i = versions.length; i--;) {
        if (compareVersions(version, versions[i]) > 0) {
            versions.splice(i + 1, 0, version);
            break;
        }
    }

    if (i === -1) {
        versions.unshift(version);
    }
}

/**
 * Maps from a request path to a Component configuration object, see
 * ./conf/module.conf.default.
 *
 * @param {String} path request path
 * @return {String} component id
 */
ComponentContainer.prototype.getComponentByRequestPath = function(path) {
    if (path.charAt(path.length - 1) != '/') {
        path += '/';
    }

    var match = null, item, u;

    for ( var mod in this.componentMap) {
        item = this.componentMap[mod];

        u = item.path ? item.path : item.url;

        if (u.charAt(u.length - 1) != '/') {
            u += '/';
        }

        if (path.indexOf(u) == 0) {
            // name + version
            match = item.id + ';' + item.version;
            break;
        }
    }
    if (!match) {
        throw new Error('Module config for ' + path + ' not found');
    }

    return match;
};

/**
 * Resolves a webcomponent:// protocol uri to a host-local or remote HTTP URL.
 *
 * @param {String} module module id (<name>;<version>)
 * @param {String} url uri to resolve
 * @param {String} resoled URL
 */
ComponentContainer.prototype.resolveUrl = function(module, url) {
    var componentProtocol = ComponentContainer.COMPONENT_PROTOCOL.length, moduleId = url
            .substring(componentProtocol, url.indexOf('/', componentProtocol + 1)), path = url
            .substring(componentProtocol + moduleId.length), conf = this.getConfiguration(moduleId);
    if (conf.url.indexOf('http') > -1) {
        return conf.url + path;
    } else {
        return mod_path.join(conf.url, path);
    }
};

ComponentContainer.prototype.getViewConfigItem = function(url, moduleConfig) {
    if (moduleConfig && moduleConfig.views) {
        for ( var i = 0, l = moduleConfig.views.length; i < l; i++) {
            var c = mod_path.join(moduleConfig.url, moduleConfig.views[i].view);

            if (url.lastIndexOf(c) === url.length - c.length) {
                return moduleConfig.views[i];
            }
        }
    }
    return null;
};
