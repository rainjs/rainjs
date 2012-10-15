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

define([
    'raintime/lib/promise',
    'raintime/messaging/sockets',
    'raintime',
    'raintime/logger'
], function (Promise, Sockets, Raintime, Logger) {

    var logger = Logger.get({
        id: 'core'
    });

    var socketQueue = [];
    /**
     * The ClientRenderer handles the registration and inserting of new components from the server.
     * If a component takes too long to be obtained from the server, a placeholder is used to show
     * that the component is still loading.
     *
     * This works for all transport layers.
     *
     * @name ClientRenderer
     * @class A ClientRenderer instance
     * @constructor
     */
    function ClientRenderer() {
        var self = this;

        this.placeholderComponent = null;
        this.placeholderTimeout = 500;
        this.counter = 0;

        /**
         * A map of objects that have been rendered inside a container and are waiting for their
         * parent container to get rendered.
         *
         * @type Object
         */
        this.orphans = {};

        this._isSocketConnected = false;

        var socket = this.socket = Sockets.getSocket('/core');
        socket.on('render', function (component) {
            Raintime.componentRegistry.deregister(component.instanceId);
            self.renderComponent(component);
        });

        socket.on('connect', function () {
            self._isSocketConnected = true;
            for (var i = 0, len = socketQueue.length; i < len; i++) {
                socket.emit('render', socketQueue[i], function (error) {});
            }
        });
    }

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
        return ClientRenderer._instance
                || (ClientRenderer._instance = new ClientRenderer);
    };

    /**
     * Sets the placeholder component.
     *
     * @param {Object} component the whole rendered placeholder component
     */
    ClientRenderer.prototype.setPlaceholder = function (component) {
        this.placeholderComponent = component;
    };

    /**
     * Sets the placeholder timeout which is set from the server configuration.
     *
     * @param {Number} milliseconds time in milliseconds
     */
    ClientRenderer.prototype.setPlaceholderTimeout = function (milliseconds) {
        this.placeholderTimeout = milliseconds;
    };

    /**
     * Requests a component over websockets.
     *
     * @param {Object} component the information about the requested component
     */
    ClientRenderer.prototype.requestComponent = function (component) {
        if (!component.id || !component.instanceId || !component.view) {
            logger.error('Component id, instance id and view are required: ' +
                         JSON.stringify(component));
            return;
        }
        if (component.placeholder && component.placeholder === true) {
            placeholderTimeout(this, component);
        }
        if (this._isSocketConnected) {
            this.socket.emit('render', component, function (error) {
                if (error) {
                    logger.error('An error occurred in ClientRenderer on render emit.', error);
                }
            });
        } else {
            socketQueue.push(component);
        }
    };

    /**
     * Renders the component to the DOM and registers it.
     * This method takes care of rendering orphaned components (components rendered inside a
     * a container which get sent to the client before their placeholder div).
     *
     * @param {Object} component the rendered component
     */
    ClientRenderer.prototype.renderComponent = function (component) {
        var domElement = $('#' + component.instanceId);

        if (!domElement.length) {
            if (!this.orphans[component.containerId]) {
                this.orphans[component.containerId] = [];
            }

            this.orphans[component.containerId].push(component);
            return;
        }

        domElement.css('visibility', 'hidden').html(component.html);
        domElement.attr('id', component.instanceId);
        domElement.attr('class',
                        'app-container ' + component.id + '_' + component.version.replace(/[\.]/g, '_')
        );

        if (this.orphans[component.instanceId]) {
            this.orphans[component.instanceId].forEach(this.renderComponent, this);
            delete this.orphans[component.instanceId];
        }

        if (component.children) {
            for (var len = component.children.length, i = 0; i < len; i++) {
                var childComponent = component.children[i];
                childComponent.parentInstanceId = component.instanceId;

                Raintime.componentRegistry.preRegister(childComponent);

                if (childComponent.placeholder === true) {
                    placeholderTimeout(this, childComponent);
                }
            }
        }

        if (!component.css || 0 === component.css.length) {
            this._showHTML(component, domElement);
        } else {
            this._loadCSS(component.css, this._showHTML.bind(this, component, domElement));
        }
    };

    /**
     * @param {Object} component the rendered component
     * @param {DomElement} element The wrapper of the component
     */
    ClientRenderer.prototype._showHTML = function (component, element) {
        element.css('visibility', 'visible');
        // Registers the component.
        Raintime.componentRegistry.register(component);
    };

    /**
     * Renders the placeholder.
     *
     * @param {String} instanceId the instanceId of the component for the placeholder
     */
    ClientRenderer.prototype.renderPlaceholder = function (instanceId) {
        this.placeholderComponent.instanceId = instanceId;
        this.renderComponent(this.placeholderComponent);
    };

    /**
     * Renders the placeholder if the component is not returned in time (placeholderTimeout).
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} placeholder the placeholder component
     * @private
     * @memberOf ClientRenderer#
     */
    function placeholderTimeout(self, placeholder) {
        setTimeout(function () {
            if (!$('#' + placeholder.instanceId).hasClass('app-container')) {
                logger.warn('The component "' + placeholder.id +
                            '" exceeded the placeholder timeout.');
                self.renderPlaceholder(placeholder.instanceId);
            }
        }, self.placeholderTimeout);
    }

    /**
     * Load css files and insert html after the css files are completely loaded.
     * Maybe there is a better way. This works on IE8+, Chrome, FF, Safari.
     *
     * @param {Array} css CSS dependencies
     * @param {Function} callback is invoked after all css dependencies are loaded
     * @private
     * @memberOf ClientRenderer#
     */
    ClientRenderer.prototype._loadCSS = function (css, callback) {
        var head = $('head');
        var loadedFiles = 0;

        for (var i = 0, len = css.length; i < len; i++) {

            var loader = new Image();
            loader.onerror = function (e) {
                if (++loadedFiles === css.length) {
                    callback();
                }
            };
            loader.src = css[i].path;

            if (0 === head.find("link[href='" + css[i].path + "']").length) {
                var link;

                if (document.createStyleSheet) {
                    link = document.createStyleSheet(css[i].path);
                } else {
                    link = document.createElement('link');
                    link.type = 'text/css';
                    link.rel = 'stylesheet';
                    link.href = css[i].path;
                }

                if (css[i].media) {
                    link.media = css[i].media;
                }

                head.append(link);
            }
        }
    };

    return window.ClientRenderer = ClientRenderer;
});
