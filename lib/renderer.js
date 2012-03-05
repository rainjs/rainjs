"use strict";

var Handlebars = require('handlebars');
var config = require('./configuration');
var componentRegistry = require('./component_registry');
var fs = require('fs');
var http = require('http');

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
        rain: this.createRainContext({
            component: mainComponent,
            transport: response
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
    var transport = parentRainContext.transport;
    transport.renderLevel = !transport.renderLevel ? 1 : transport.renderLevel + 1;
    // extend data with rainContext
    data.rain = this.createRainContext({
        component: component,
        transport: transport
    });

    var controller = view.controller && view.controller.client ? view.controller.client : null;
    if (controller) {
        controller = component.id + '/' + version + '/js/' + controller;
    }

    var html = view.compiledTemplate(data);

    transport.renderLevel--;
    var rainContext = data.rain();

    return {
        css: rainContext.css,
        html: html,
        controller: controller,
        moduleId: component.id+'-'+component.version
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
 * @param {Object} transport Contains the transport object
 * @returns {Function} Returns the rain context as function
 */
Renderer.prototype.createRainContext = function(opt) {
    var rainContext = {
        component: opt.component,
        css: [],
        transport: opt.transport
    };
    return function() {
        return rainContext;
    };
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
    var responseText = '<script type="text/javascript">renderComponent(' + JSON.stringify(component) + ')</script>';

    if (transport instanceof http.ServerResponse) {
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
