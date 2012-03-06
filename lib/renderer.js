"use strict";

var Handlebars = require('handlebars');
var config = require('./configuration');
var componentRegistry = require('./component_registry');
var fs = require('fs');
var http = require('http');
var crypto = require('crypto');

/**
 * Provides an API to render components.
 *
 * @name Renderer
 * @class Component renderer.
 * @constructor
 */
function Renderer() {

};

Renderer.prototype.renderBootstrap = function(mainComponent, viewId, request, response) {
    // add response counter
    var initData = {
        name: mainComponent.id,
        version: mainComponent.version,
        viewId: viewId,
        data: {
            query: request.query,
            body: request.body
        },
        rain: createRainContext(this, {
            component: mainComponent,
            transport: response,
            request: request
        })
    };

    var core = componentRegistry.getConfig('core', componentRegistry.getLatestVersion('core'));

    return core.views['bootstrap'].compiledTemplate(initData);
};

/**
 * Renders the component and returns an object with the data for the client
 *
 * @param {Object} opt Contains a map of component information
 * @param {Object} opt.component The component which get rendered
 * @param {Object} opt.viewId The view id of the component which get rendered
 * @param {Object} opt.data Custom data for the templating and it contains the rain context
 * @returns {Object}
 */
Renderer.prototype.renderComponent = function(opt) {
    var component = opt.component;
    var viewId = opt.viewId;
    var version = component.version;
    var data = opt.data;
    var view = component.views[viewId];
    if (!view) {
        throw new RainError("Can't render component! View: " + viewId + " doesn't exists!", "Renderer");
    }

    // build rain context
    var parentRainContext = data.rain();

    // extend data with rainContext
    data.rain = createRainContext(this, {
        component: component,
        transport: parentRainContext.transport,
        request: parentRainContext.request,
        instanceId: opt.instanceId
    });

    var controller = view.controller && view.controller.client ? view.controller.client : null;
    if (controller) {
        controller = component.id + '/' + version + '/js/' + controller;
    }

    var html = view.compiledTemplate(data);
    parentRainContext.transport.renderLevel--;

    return {
        css: data.rain().css,
        html: html,
        controller: controller || null,
        instanceId: opt.instanceId,
        staticId: opt.staticId || '',
        componentId: component.id,
        version: component.version
    };
};

/**
 * Renders the component and send it to the transport layer back
 *
 * @param {Object} opt Map of component information for the :js:func:`Renderer#renderComponent`
 * @return void
 */
Renderer.prototype.sendComponent = function(transport, opt) {
    response(this, transport, this.renderComponent(opt));
};

/**
 * This function creates the rain context
 *
 * @param {Object} opt
 * @param {Object} opt.component Contains the component
 * @param {Object} opt.transport Contains the transport object
 * @private
 * @returns {Function} Returns the rain context as function
 */
function createRainContext(self, opt) {
    var rainContext = {
        component: opt.component,
        css: [],
        transport: opt.transport,
        request: opt.request,
        instanceId: opt.instanceId
    };
    return function() {
        return rainContext;
    };
};

/**
 * Creates an instance id related to the session id, parent instance id and static id
 * 
 * @param {String} pInstanceId Parent instance id
 * @param {String} staticId Static id
 * @param {String} sessionId Session id
 * @returns {String}
 */
Renderer.prototype.createInstanceId = function (pInstanceId, staticId, sessionId) {
    return crypto.createHash('sha1').update(sessionId+(new Date()).getTime()+staticId+pInstanceId).digest('hex');
};

/**
 * Sends the component to the client with the specified transport layer
 *
 * @param {Renderer} self The class instance
 * @param {ServerResponse|Socket} transport The transport layer which can be a http ServerResponse or a Socket.
 * @param {Object} component The rendered component ready for the client
 * @private
 * @memberOf Renderer#
 */
function response(self, transport, component) {
    if (transport instanceof http.ServerResponse) {
        var responseText = '\n<script type="text/javascript">renderComponent(' + JSON.stringify(component) + ')</script>';
        console.log(transport.renderLevel)
        if (transport.renderLevel == 0) {
            transport.end(responseText);
        } else {
            transport.write(responseText);
        }
    } else if (transport instanceof Socket) {
        transport.emit('renderComponent', renderedComponent);
    }
};

module.exports = new Renderer();
