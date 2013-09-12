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

define([
    'raintime/lib/promise',
    'raintime/messaging/sockets',
    'raintime/component_registry',
    'raintime/component',
    'raintime/logger',
    'raintime/css/renderer'
], function (Promise, SocketHandler, ComponentRegistry, Component, Logger, CssRenderer) {

    var logger = Logger.get({id: 'core'});

    var seq = Promise.seq,
        defer = Promise.defer;

    /**
     * The ClientRenderer handles the registration and insertion of new components from the server.
     * If a component takes too long to be obtained from the server, a placeholder is used to show
     * that the component is still loading.
     *
     * This works for all transport layers.
     *
     * @name ClientRenderer
     * @constructor
     */
    function ClientRenderer() {
        /**
         * The component registry instance.
         *
         * @type {ComponentRegistry}
         * @private
         */
        this._registry = new ComponentRegistry();

        /**
         * The socket used to send and receive render events.
         *
         * @type {Socket}
         * @private
         */
        this._socket = SocketHandler.get().getSocket('/core');

        /**
         * A map of components that have been rendered inside a container and are waiting for the
         * container to be rendered.
         *
         * @type {Object}
         */
        this._orphanComponents = {};

        /**
         * A map of timeouts set for showing the placeholder.
         *
         * @type {Object}
         * @private
         */
        this._timeouts = {};

        /**
         * The number of milliseconds to wait before showing the placeholder for a component.
         *
         * @type {Number}
         * @private
         */
        this._placeholderTimeout = rainContext.placeholderTimeout || 1000;

        /**
         * The placeholder component. This component is not registered.
         *
         * @type {Component}
         * @private
         */
        this._placeholder = new Component(rainContext.placeholder);

        /**
         * A counter used to generated unique instance ids.
         *
         * @type {Number}
         * @private
         */
        this._instanceIdCounter = 0;

        this._socket.on('render', this.renderComponent.bind(this));

        CssRenderer.get().load(this._placeholder);

        var mainComponentInstanceId = $($('body div').get(0)).attr('id');
        this._setPlaceholderTimeout(mainComponentInstanceId);
    }

    /**
     * Gets the component registry instance.
     *
     * @returns {ComponentRegistry}
     */
    ClientRenderer.prototype.getComponentRegistry = function () {
        return this._registry;
    };

    /**
     * Registers a component and adds its markup to the DOM.
     *
     * @param {Object} componentData the data sent by the server for a rendered component
     *
     * @example
     *
     *      ClientRenderer.get.renderComponent({
     *          css: [
     *              {path: '/example/3.0/css/index.css', ruleCount: 7},
     *              {path: '/example/3.0/css/jquery-ui-1.10.2.custom.css',ruleCount: 357}
     *          ],
     *          children: [{
     *              id: 'language_selector',
     *              version: '1.0',
     *              controller: '/language_selector/1.0/js/index.js',
     *              instanceId:'14fa56e4eecc55ec6e4c41eb849091935f56431d',
     *              staticId: 'selector',
     *              placeholder: true
     *          }],
     *          html:'component markup',
     *          controller: '/example/3.0/js/button.js',
     *          instanceId: '3abb0ac7e9936290f5083230fe4c27b3f94dd0f1',
     *          staticId: 'cancelButton',
     *          id: 'example',
     *          version: '3.0',
     *          containerId: null
     *      });
     */
    ClientRenderer.prototype.renderComponent = function (componentData) {
        var parent = this._registry.getParent(componentData.instanceId),
            self = this;

        componentData.parentInstanceId = parent && parent.instanceId();

        var component = new Component(componentData);

        this._registry.register(component);

        component.children().forEach(function (child) {
            self._registry.waitInstanceId(child.instanceId);
        });

        if (component.rootElement().length === 0) {
            // an orphan can also be a child of a component rendered in a container
            var containerId = component.containerId() || component.parentInstanceId();

            if (!this._orphanComponents[containerId]) {
                this._orphanComponents[containerId] = [];
            }
            this._orphanComponents[containerId].push(component);

            return;
        }

        this._setupComponent(component);
    };

    /**
     * Adds the markup to DOM, loads the client-side controller and the CSS.
     *
     * @param {Component} component
     * @private
     */
    ClientRenderer.prototype._setupComponent = function (component) {
        var element = component.rootElement(),
            instanceId = component.instanceId(),
            self = this;

        if (element.find('.placeholder-overlay').length === 0) {
            element.css('visibility', 'hidden');
        } else {
            element.find('.placeholder-fix').remove();
        }

        element.attr('id', instanceId);
        element.attr('class', component.cssClass());
        element.append(component.html());

        this._registry.load(component).then(function () {
            self._showComponent(component);
        }, function (error) {
            logger.error('Failed to load component: ' + component.uniqueId());
        });

        if (this._orphanComponents[instanceId]) {
            this._orphanComponents[instanceId].forEach(this._setupComponent, this);
            delete this._orphanComponents[instanceId];
        }
    };

    /**
     * This method is called after the component is fully loaded and makes the component
     * visible.
     *
     * @param {Component} component
     * @private
     */
    ClientRenderer.prototype._showComponent = function (component) {
        var element = component.rootElement(),
            instanceId = component.instanceId(),
            children = component.children();

        if(this._timeouts[instanceId]) {
            clearTimeout(this._timeouts[instanceId]);
            delete this._timeouts[instanceId];
        }

        this._hidePlaceholder(component.instanceId());
        element.css('visibility', '');

        for (var i = 0, len = children.length; i < len; i++) {
            var child = children[i];
            if (child.placeholder) {
                this._setPlaceholderTimeout(child.instanceId);
            }
        }
    };

    /**
     * Requests a component over websockets.
     *
     * @param {Object} options the information about the requested component
     * @param {String} options.id the component id
     * @param {String} [options.version] the component version
     * @param {String} options.view the view id
     * @param {String} options.instanceId the instance id
     * @param {String} [options.sid] the static id
     * @param {Object} [options.context] custom data for the template
     * @param {Boolean} [options.placeholder = false] enable / disable placeholder
     *
     * @returns {promise} The loaded component.
     */
    ClientRenderer.prototype.requestComponent = function (options) {
        if (!options.id || !options.instanceId || !options.view) {
            throw new RainError('id, instanceId and view are required');
        }

        var self = this;

        if (options.placeholder === true) {
            this._setPlaceholderTimeout(options.instanceId);
        }

        this._socket.emit('render', options);

        this._registry.waitInstanceId(options.instanceId);

        return seq([
            function () {
                return self._registry.getComponent(options.instanceId);
            },
            function (component) {
                var deferred = defer();

                component.once('start', function () {
                    deferred.resolve(component);
                });

                return deferred.promise;
            }
        ]);
    };

    /**
     * Removes the component associated with the specified instance id.
     *
     * @param {String} instanceId the instance id of the component to be removed
     */
    ClientRenderer.prototype.removeComponent = function (instanceId) {
        var component = this._registry.getComponent(instanceId);

        if (component instanceof Component) {
            this._registry.deregister(instanceId);
            component.rootElement().remove();
        }
    };

    /**
     * Add a component container to the DOM.
     *
     * @param {jQuery} element the element to which to add the container.
     * @returns {String} the generated instance id
     */
    ClientRenderer.prototype.createComponentContainer = function (element) {
        var instanceId = Date.now().toString() + '-' + this._instanceIdCounter++;
        $(element).html('<div id="' + instanceId + '"></div>');
        return instanceId;
    };

    /**
     * Shows the placeholder for the component having the specified instance id.
     *
     * @param {String} instanceId
     */
    ClientRenderer.prototype._showPlaceholder = function (instanceId) {
        var element = $('#' + instanceId),
            placeholderOverlay = $('<div></div>');

        placeholderOverlay.addClass('placeholder-overlay ' + this._placeholder.cssClass());
        placeholderOverlay.html(this._placeholder.html());
        placeholderOverlay.css({
            position: 'static',
            visibility: 'hidden'
        });

        element.addClass('app-container');

        // in some cases the placeholder isn't shown if the component div has only the
        // placeholder as content (which is absolute)
        element.append('<div class="placeholder-fix">&nbsp;</div>');
        element.append(placeholderOverlay);

        element.css({
            visibility: '',
            position: 'relative',
            'min-height': placeholderOverlay.width() + 'px',
            'min-width': placeholderOverlay.height() + 'px'
        });

        placeholderOverlay.css({
            position: '',
            visibility: ''
        });
    };

    /**
     * Hides the placeholder for the component having the specified instance id.
     *
     * @param {String} instanceId
     */
    ClientRenderer.prototype._hidePlaceholder = function (instanceId) {
        var element = $('#' + instanceId),
            placeholder = element.find('.placeholder-overlay');

        element.css({
            position: '',
            'min-height': ''
        });

        if (placeholder.length > 0) {
            placeholder.remove();
            element.find('.placeholder-fix').remove();
        }
    };

    /**
     * Sets a timeout to show the placeholder.
     *
     * @param {String} instanceId
     * @private
     */
    ClientRenderer.prototype._setPlaceholderTimeout = function (instanceId) {
        var self = this,
            element = $('#' + instanceId);

        if (element.length === 0) {
            return;
        }

        this._timeouts[instanceId] = setTimeout(function () {
            if(element.css('visibility') === 'hidden' || !element.hasClass('app-container')) {
                self._showPlaceholder(instanceId);
            }
        }, this._placeholderTimeout);
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
            ClientRenderer._instance = new ClientRenderer();
        }

        return ClientRenderer._instance;
    };

    window.ClientRenderer = ClientRenderer;

    return ClientRenderer;
});
