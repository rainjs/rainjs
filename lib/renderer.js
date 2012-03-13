"use strict";

var Handlebars = require('handlebars');
var config = require('./configuration');
var componentRegistry = require('./component_registry');
var fs = require('fs');
var http = require('http');
var io = require('socket.io');
var crypto = require('crypto');
var errorHandler = require('./error_handler');
var socketRegistry = require('./socket_registry');
var dataLayer = require('./data_layer');
var io = require('socket.io');
var util = require('./util');

/**
 * Provides an API to render components.
 *
 * @name Renderer
 * @class Component renderer.
 * @constructor
 */
function Renderer() {
    registerWebsocketLayer(this);
};

/**
 * Renders the bootstrap for the initialized request.
 * This is only used for the HTTP transport layer
 *
 * @param {Object} mainComponent The component which is requested
 * @param {String} viewId The view id which is requested
 * @param {HttpRequest} request HttpRequest object
 * @param {HttpResponse} response HttpResponse object
 * @returns {String} The rendered html
 */
Renderer.prototype.renderBootstrap = function(mainComponent, viewId, request, response) {
    /**
     * used to count the levels that the renderer knows when to finish with with the response
     */
    response.renderLevel = 0;
    /**
     * used to create the unique instanceId
     */
    response.renderCount = 0;

    /**
     * Render the placeholder
     */
    var loadingComponent = config.loadingComponent;
    var placeholderComponent = componentRegistry.getConfig(loadingComponent.id, loadingComponent.version);
    var renderedPlaceholder = this.renderComponent({
        component: placeholderComponent,
        viewId: loadingComponent.viewId,
        rain: this.createRainContext({
            component: placeholderComponent,
            transport: response,
            session: request.session
        })
    });

    /**
     * create new rain context to compile the bootstrap
     */
    this.rain = this.createRainContext({
        component: mainComponent,
        transport: response,
        session: request.session
    });

    /**
     * Template data
     */
    var initData = {
        id: mainComponent.id,
        version: mainComponent.version,
        viewId: viewId,
        placeholder: JSON.stringify(renderedPlaceholder),
        placeholderTimeout: loadingComponent.timeout,
        data: {
            query: request.query,
            body: request.body
        }
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
 * @param {Object} opt.error Customer error handling
 * @returns {Object}
 */
Renderer.prototype.renderComponent = function(opt) {
    var component = opt.component;
    var viewId = opt.viewId;
    var data = opt.data;
    var parentRainContext = opt.rain;
    var view = component.views[viewId];
    if (!view) {
        var error = errorHandler.getErrorComponent(404);
        return this.renderComponent({
            component: error.component,
            viewId: error.view,
            instanceId: opt.instanceId,
            data: { error: new RainError("Can't render component! View: %s doesn't exists!", [viewId]) },
            rain: parentRainContext
        });
    }

    // extend data with rainContext
    this.rain = this.createRainContext({
        component: component,
        transport: parentRainContext.transport,
        instanceId: opt.instanceId,
        session: parentRainContext.session
    });

    var controller = view.controller && view.controller.client ? view.controller.client : null;

    var html = "";
    try {
        html = view.compiledTemplate(data);
    } catch(exception) {
        /**
         * parsing error -> render error component
         */
        var error = errorHandler.getErrorComponent(500);
        exception.stack = exception.stack.replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
        return this.renderComponent({
            component: error.component,
            viewId: error.view,
            instanceId: opt.instanceId,
            data: { error: exception },
            rain: parentRainContext
        });
    }

    return {
        css: this.rain.css,
        children: this.rain.childrenInstanceIds,
        html: html,
        controller: controller,
        instanceId: opt.instanceId,
        staticId: opt.staticId || '',
        id: component.id,
        version: component.version,
        error: opt.error || null
    };
};

/**
 * Registers the websocket layer for rendering
 *
 * @param {Renderer} self The class instance
 */
function registerWebsocketLayer(self){
    socketRegistry.register('/core', function (socket) {
        socket.on('render', function(component, acknowledge){
            /**
             * used to count the levels that the acknowledge renderer knows when to finish with with the response
             */
            socket.renderLevel = 0;
            /**
             * used to create the unique instanceId
             */
            socket.renderCount = 0;

            if (!component.id){
                acknowledge("The server didn't received a component id!");
            }

            if (!component.version){
                component.version = componentRegistry.getLatestVersion(component.id);
            }

            self.loadDataAndSend(component, socket);
        });
    });
}

/**
 * Loads the data from the data layer and sends the it to get rendered and
 * response over the specified transport layer
 *
 * @param {Object} component The component information
 * @param {HttpServerResponse|Socket} transport The transport layer
 */
Renderer.prototype.loadDataAndSend = function(component, transport){
    var self = this;
    var componentConfig = componentRegistry.getConfig(component.id, component.version);

    var time = Date.now();
    dataLayer.loadData({
        id: component.id,
        viewId: component.view,
        version: component.version,
        data: component.data
    }, function(err, templateData) {
        console.debug("Data loading time:", Date.now() - time, 'ms');
        if (err instanceof Error) {
            replaceWithError(500, component, err);
            templateData = component.data;
            componentConfig = componentRegistry.getConfig(component.id, component.version);
        }
        if (!templateData) {
            templateData = {};
        }
        var renderingTime = Date.now();
        self.sendComponent(transport, {
            component: componentConfig,
            viewId: component.view,
            staticId: component.sid,
            instanceId: component.instanceId,
            data: templateData,
            rain: self.createRainContext({
                transport: transport,
                session: component.session
            })
        });
        console.debug("Rendering time:", Date.now() - renderingTime, 'ms');
        console.debug("Reponse time for the component:", Date.now() - time, 'ms');
    });
};

/**
 * Replaces the current component with an error component.
 *
 * @param {Number} statusCode Status code of the error
 * @param {Object} component information as a reference
 * @param {RainError} exception The specified error
 * @private
 * @memberOf ComponentHelper#
 */
Renderer.prototype.replaceWithError = function(statusCode, component, exception) {
    var error = errorHandler.getErrorComponent(statusCode);
    component.id = error.component.id;
    component.version = error.component.version;
    component.view = error.view;
    exception.stack = exception.stack.replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
    component.data = { error: exception };
};

/**
 * Renders the component and send it to the transport layer back
 *
 * @param {Object} opt Map of component information for the :js:func:`Renderer#renderComponent`
 * @return void
 */
Renderer.prototype.sendComponent = function(transport, opt) {
    var renderedComponent = this.renderComponent(opt);
    transport.renderLevel--;
    response(this, transport, renderedComponent);
};

/**
 * This function creates the rain context
 *
 * @param {Object} opt
 * @param {Object} opt.component Contains the component
 * @param {Object} opt.transport Contains the transport object
 * @private
 * @returns {Object} Returns the rain context as function
 */
Renderer.prototype.createRainContext = function(opt) {
    return {
        component: opt.component,
        css: [],
        childrenInstanceIds: [],
        instanceId: opt.instanceId,
        transport: opt.transport,
        session: opt.session
    };
};

/**
 * Creates the script tag for the frontend
 *
 * @param {Object} component A rendered component
 * @returns {String}
 */
Renderer.prototype.clientRendererScript = function(component){
    return '\n<script type="text/javascript">renderComponent('+JSON.stringify(component)+')</script>';
};

/**
 * Creates an instance id related to the session id, parent instance id and static id
 *
 * @param {String} pInstanceId Parent instance id
 * @param {String} staticId Static id
 * @param {String} sessionId Session id
 * @returns {String}
 */
Renderer.prototype.createInstanceId = function (pInstanceId, counter, staticId) {
    staticId = staticId || Math.floor(Math.random(0, Date.now()));
    return crypto.createHash('sha1').update((Date.now().toString()+counter.toString()+staticId+pInstanceId).toString()).digest('hex');
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
        var responseText = self.clientRendererScript(component);

        if (transport.renderLevel == 0) {
            transport.end(responseText);
        } else {
            transport.write(responseText);
        }
    } else if (transport instanceof io.Socket) {
        transport.emit('render', component);
    }
};

module.exports = new Renderer();
