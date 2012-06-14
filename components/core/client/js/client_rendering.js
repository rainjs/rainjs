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
    'raintime'
], function (Promise, Sockets, Raintime) {
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

        var socket = this.socket = Sockets.getSocket('/core');
        socket.on('render', function (component) {
            Raintime.componentRegistry.deregister(component.instanceId);
            self.renderComponent(component);
        });

        socket.on('connect', function() {
            for (var i = 0, len = socketQueue.length; i < len; i++) {
                socket.emit('render', socketQueue[i], function (error) {});
            }
        });
    }

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
            console.error('Component id, instance id and view are required!');
            return;
        }
        if (component.placeholder && component.placeholder === true) {
            placeholderTimeout(this, component);
        }
        if (this.socket.socket.connected) {
            this.socket.emit('render', component, function (error) {});
        } else {
            socketQueue.push(component);
        }
    };

    /**
     * Renders the component to the DOM and registers it.
     *
     * @param {Object} component the rendered component
     */
    ClientRenderer.prototype.renderComponent = function (component) {
        for (var len = component.children.length, i = 0; i < len; i++) {
            var childComponent = component.children[i];
            Raintime.componentRegistry.preRegister(childComponent);
            if (childComponent.placeholder === true) {
                placeholderTimeout(this, childComponent);
            }
        }

        var domElement = $('#' + component.instanceId);
        domElement.hide().html(component.html);
        domElement.attr('id', component.instanceId);
        domElement.attr('class',
                        'app-container ' + component.id + '_' + component.version.replace(/[\.]/g, '_')
        );

        if (!component.css || component.css.length == 0) {
            showHTML(component, domElement);
        } else {
            this._loadCSS(component.css, function () {
                showHTML(component, domElement);
            });
        }
    };

    /**
     * @param {Object} component the rendered component
     * @param {DomElement} element The wrapper of the component
     */
    function showHTML(component, element) {
        element.show();
        // Registers the component.
        Raintime.componentRegistry.register(component);
    }

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
        setTimeout(function() {
            if (!$('#' + placeholder.instanceId).hasClass('app-container')) {
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
            if (head.find("link[href='" + css[i].path + "']").length > 0) {
                if (++loadedFiles == css.length) {
                    callback();
                }
            } else {
                var link = null;

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

                var loader = new Image();
                loader.onerror = function (e) {
                    if (++loadedFiles == css.length) {
                        callback();
                    }
                };
                head.append(link);
                loader.src = css[i].path;
            }
        }
    };

    /**
     * Export as a global.
     *
     * @private
     */
    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
