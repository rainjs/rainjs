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

/*
ClientRenderer
 - receives render messages from the server
 - registers the component in ComponentRegistry
 - inserts the component's markup in the page
 - displays the placeholder

ComponentRegistry
- keeps a map of components
- load component resources (CSS and JavaScript)
- component lifecycle
- finding components ???

Component
- keep component info and some common methods

Controller
- base class for the component's client side controller
- will contain the methods from async controller and will inherit from event emitter

Context
- client side API (can't change this since I would break the API)



Component lifecycle (method + event):
- init (the controller instance was created)
- start (the component and all its resources are loaded successfully)
- destroy (the component was removed from the page)
- error
 */

"use strict";

define([
    'raintime/lib/promise',
    'raintime/messaging/sockets',
    'raintime/component_registry',
    'raintime/component',
    'raintime/logger',
    'raintime/css/renderer'
], function (Promise, SocketHandler, ComponentRegistry, Component, Logger, CssRenderer) {

    var logger = Logger.get({
        id: 'core'
    });

    var when = Promise.when;

    /**
     * The ClientRenderer handles the registration and insertion of new components from the server.
     * If a component takes too long to be obtained from the server, a placeholder is used to show
     * that the component is still loading.
     *
     * This works for all transport layers.
     *
     * @name ClientRenderer
     * @class A ClientRenderer instance
     */
    function ClientRenderer() {
        var self = this;

        this._registry = new ComponentRegistry();
        this._registry.on('start', function (component) {
            self._showComponent(component);
        });

        /**
         * A map of objects that have been rendered inside a container and are waiting for their
         * parent container to get rendered.
         *
         * @type Object
         */
        this._orphanComponents = {};

        this._placeholderTimeout = 20000;
        this._placeholderComponent = null;

        this._socket = SocketHandler.get().getSocket('/core');
        this._socket.on('render', function (componentData) {
            self.renderComponent(componentData);
        });
    }

    /**
     *
     * @returns {ComponentRegistry}
     */
    ClientRenderer.prototype.getComponentRegistry = function () {
        return this._registry;
    };

    /**
     * Renders the component to the DOM and registers it.
     * This method takes care of rendering orphaned components (components rendered inside a
     * a container which get sent to the client before their placeholder div).
     *
     * @param {Object} componentData the rendered component
     *
     *  {
     *      "css":[
     *          {"path":"/example/3.0/css/index.css","ruleCount":7},
     *          {"path":"/example/3.0/css/jquery-ui-1.10.2.custom.css","ruleCount":357}
     *      ],
     *      "children":[{
     *           "id":"language_selector",
     *           "version":"1.0",
     *           "controller":"/language_selector/1.0/js/index.js",
     *           "instanceId":"14fa56e4eecc55ec6e4c41eb849091935f56431d",
     *           "staticId": "only if one is specified"
     *           "placeholder":true
     *       }],
     *       "html":"\n\n\n<div class=\"example-body\">\n    <h1 class=\"header\">Feature Examples</h1>\n    <div class=\"select_language\">\n        <div id=\"14fa56e4eecc55ec6e4c41eb849091935f56431d\"></div>\n\n    </div>\n    <div class=\"navi\">\n        <h3><a href=\"#\">Data Layer</a></h3>\n        <div data-example-view=\"notes\"></div>\n\n        <h3><a href=\"#\">Events</a></h3>\n        <div data-example-view=\"event_emitter\"></div>\n\n        <h3><a href=\"#\">Loading</a></h3>\n        <div data-example-view=\"level1\"></div>\n\n        <h3><a href=\"#\">CSS cross referencing</a></h3>\n        <div data-example-view=\"css_cross_referencing\"></div>\n        <h3><a href=\"#\">Platform Language</a></h3>\n        <div data-example-view=\"platform_language\"></div>\n\n        <h3><a href=\"#\">Layout localization</a></h3>\n        <div data-example-view=\"layout_localization\"></div>\n\n        <h3><a href=\"#\">Intent Security</a></h3>\n        <div data-example-view=\"intent_security\"></div>\n\n        <h3><a href=\"#\">Image localization</a></h3>\n        <div data-example-view=\"image_localization\"></div>\n\n        <h3><a href=\"#\">Server-side text localization</a></h3>\n        <div data-example-view=\"text_localization\"></div>\n\n        <h3><a href=\"#\">Client-side text localization</a></h3>\n        <div data-example-view=\"client_side_text_localization\"></div>\n\n        <h3><a href=\"#\">Format Helpers</a></h3>\n        <div data-example-view=\"format_helpers\"></div>\n\n        <h3><a href=\"#\">Containers v1</a></h3>\n        <div data-example-view=\"containers_v1\"></div>\n\n        <h3><a href=\"#\">Containers v2</a></h3>\n        <div data-example-view=\"containers_v2\"></div>\n\n        <h3><a href=\"#\">Logging</a></h3>\n        <div data-example-view=\"logging\"></div>\n\n        <h3><a href=\"#\">Promised lifecycle event</a></h3>\n        <div data-example-view=\"promise_use\"></div>\n\n        <h3><a href=\"#\">Partials</a></h3>\n        <div data-example-view=\"partials\"></div>\n\n        <h3><a href=\"#\">Client-side insert</a></h3>\n        <div data-example-view=\"client_side_insert\"></div>\n    </div>\n</div>\n",
     *       "controller":"/example/3.0/js/index.js",
     *       "instanceId":"3abb0ac7e9936290f5083230fe4c27b3f94dd0f1",
     *       "staticId":"",
     *       "id":"example",
     *       "version":"3.0",
     *       "error":null,
     *       "containerId": instanceId // set only for components that are rendered inside a container
     *  }
     */
    ClientRenderer.prototype.renderComponent = function (componentData) {
        var component = new Component(componentData),
            instanceId = component.instanceId();

        if (component.rootElement().length === 0) {
            var containerId = component.containerId();

            if (!this._orphanComponents[containerId]) {
                this._orphanComponents[containerId] = [];
            }
            this._orphanComponents[containerId].push(component);

            return;
        }

        this._setupComponentMarkup(component);

        if (this._orphanComponents[instanceId]) {
            this._orphanComponents[instanceId].forEach(this._setupComponentMarkup, this);
            this._orphanComponents[instanceId] = null;
        }
    };

    ClientRenderer.prototype._setupComponentMarkup = function (component) {
        var element = component.rootElement();

        element.css('visibility', 'hidden').html(component.html());
        element.attr('id', instanceId);
        element.attr('class', component.cssClass());

        // CSS and JavaScript can be loaded at register time
        this._registry.register(component);

        // TODO: modify the CSS renderer to use Component instances
        CssRenderer.get().load(component).then(function () {

        }, function (error) {
            logger.error('Failed to load CSS for: ' + component.uniqueId());
        });
    };

    ClientRenderer.prototype._showComponent = function (component) {
        var element = component.rootElement();

        element.css('visibility', '');
        // hide the placeholder if one is present
        // set timeouts for child placeholders
    };

    /**
     * Requests a component over websockets.
     *
     * @param {Object} component the information about the requested component
     */
    ClientRenderer.prototype.requestComponent = function (component) {

    };

    /**
     * Sets the placeholder component.
     *
     * TODO: the placeholder will no longer be a component. We need to decide what we will use to
     * replace it.
     *
     * @param {Object} component the whole rendered placeholder component
     */
    ClientRenderer.prototype.setPlaceholder = function (component) {
        this._placeholderComponent = component;
        CssRenderer.get().load(component);
    };

    /**
     * Sets the placeholder timeout which is set from the server configuration.
     *
     * @param {Number} milliseconds time in milliseconds
     */
    ClientRenderer.prototype.setPlaceholderTimeout = function (milliseconds) {
        this._placeholderTimeout = milliseconds;
    };

    /**
     *
     * @param instanceId
     */
    ClientRenderer.prototype.renderPlaceholder = function (instanceId) {
        var element = $('#' + instanceId),
            placeholderOverlay = $('<div></div>');

        placeholderOverlay.addClass('placeholder-overlay placeholder_1and1_1_0');
        placeholderOverlay.html(this._placeholderComponent.html);

        element.addClass('app-container');
        element.css({
            visibility: '',
            position: 'relative'
        });

        element.append(placeholderOverlay);
    };

    /**
     * The class instance.
     * @type {ClientRenderer}
     */
    ClientRenderer._instance = null;

    /**
     * Returns the class' singleton instance.
     * @returns {ClientRenderer} the singleton instance
     */
    ClientRenderer.get = function () {
        if (!ClientRenderer._instance) {
            ClientRenderer._instance = new ClientRenderer()
        }

        return ClientRenderer._instance;
    };

    window.ClientRenderer = ClientRenderer;

    return ClientRenderer;
});