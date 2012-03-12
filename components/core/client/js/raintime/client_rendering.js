define([
    'core/js/promised-io/promise',
    'core/js/messaging/sockets',
    'core/js/raintime/raintime'
    /**
     * The ClientRenderer handles the registration and inserting of new components from the server.
     * A placeholder is replaced if a component is not in time.
     * This works for all transport layers.
     *
     * @name ClientRenderer
     * @class A ClientRenderer instance
     */
], function(Promise, Sockets, Raintime) {
    function ClientRenderer() {
        this.placeholderComponent = null;
        this.placeholderTimeout = 500;
        var self = this;

        var socket = Sockets.getSocket('/core');
        socket.on('render', function (data) {
            self.renderComponent(data);
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
     * Renders a component.
     *
     * @param {Object} component the rendered component
     */
    ClientRenderer.prototype.renderComponent = function (component) {
        insertComponent(this, component);
    };

    /**
     * Renders a placeholder.
     *
     * @param {String} instanceId the instanceId of the component for the placeholder
     */
    ClientRenderer.prototype.renderPlaceholder = function (instanceId) {
        this.placeholderComponent.instanceId = instanceId;
        this.renderComponent(this.placeholderComponent);
    };

    /**
     * Insert the component to the DOM and registers it.
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} component the rendered component
     * @private
     * @memberOf ClientRenderer#
     */
    function insertComponent(self, component) {
        var domElement = $('#' + component.instanceId);
        domElement.hide().html(component.html);
        domElement.attr('id', component.instanceId);
        domElement.attr('class',
            'app-container ' + component.id + '_' + component.version.replace(/[\.]/g, '_')
        );

        // Registers the component.
        Raintime.componentRegistry.register(component);

        loadCSS(this, component.css, function() {
            domElement.show();
        });

        for (var len = component.children.length, i = 0; i < len; i++) {
            var childComponent = component.children[i];
            Raintime.componentRegistry.preRegister(childComponent);
            placeholderTimeout(self, childComponent);
        }
    }

    /**
     * Renders the placeholder if the component is not returned in time ( placeholderTimeout ).
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
     * @param {ClientRenderer} self the class instance
     * @param {Array} css CSS dependencies
     * @param {Function} callback is invoked after all css dependencies are loaded
     * @private
     * @memberOf ClientRenderer#
     */
    function loadCSS(self, css, callback) {
        var head = $('head');
        var loadedFiles = 0;
        for (var i = 0, len = css.length; i < len; i++) {
            if (head.find("link[href='" + css[i] + "']").length > 0) {
                if (++loadedFiles == css.length) {
                    callback();
                }
            } else {
                var link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = css[i];

                var loader = new Image();
                loader.onerror = function(e) {
                    if (++loadedFiles == css.length) {
                        callback();
                    }
                };
                console.log(link)
                head.append(link);
                loader.src = css[i];
            }
        }
    }

    /**
     * Export as a global.
     */
    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
