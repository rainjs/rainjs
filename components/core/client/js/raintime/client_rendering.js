define([
    'core/js/promised-io/promise',
    'core/js/raintime/messaging',
    'core/js/raintime/raintime'
], function(Promise, messaging, raintime) {
    /**
     * The ClientRenderer handles the registration and inserting of new components from the server.
     * A placeholder is replaced if a component is not in time
     * This works for all transport layers
     *
     * @name ClientRenderer
     * @class A ClientRenderer instance
     */
    function ClientRenderer() {
        this.placeholderComponent = null;
        this.placeholderTimeout = 500;

        var socket = messaging.getWebSocket('/core');
        socket.on('render', this.renderComponent);
    }

    /**
     * Sets the placeholder component
     *
     * @param {Object} component The whole rendered placeholder component
     */
    ClientRenderer.prototype.setPlaceholder = function (component) {
        this.placeholderComponent = component;
    };

    /**
     * Sets the placeholder timeout which is set from the server configuration
     *
     * @param {Number} milliseconds Time in milliseconds
     */
    ClientRenderer.prototype.setPlaceholderTimeout = function (milliseconds) {
        this.placeholderTimeout = milliseconds;
    };

    /**
     * Renders a component
     *
     * @param {Object} component The rendered component
     * @param instanceId The instance id of the component
     *                   This is sent only if a placeholder is rendered
     */
    ClientRenderer.prototype.renderComponent = function (component) {
        insertComponent(this, component);
    };

    /**
     * Renders a placeholder
     *
     * @param {String} instanceId The instanceId of the component for the placeholder
     */
    ClientRenderer.prototype.renderPlaceholder = function (instanceId) {
        this.placeholderComponent.instanceId = instanceId;
        this.renderComponent(this.placeholderComponent);
    };

    /**
     * Insert the component to the dom and register it
     *
     * @param {ClientRenderer} self The instance of ClientRenderer
     * @param {Object} component The rendered component
     * @memberOf ClientRenderer#
     * @private
     */
    function insertComponent(self, component) {
        var domElement = $('#' + component.instanceId);
        domElement.hide().html(component.html);
        domElement.attr('id', component.instanceId);
        domElement.attr('class',
            'app-container ' + component.id + '_' + component.version.replace(/[\.]/g, '_')
        );

        //register component
        raintime.ComponentRegistry.register(component);

        loadCSS(this, component.css, function() {
            domElement.show();
        });

        for (var len = component.children.length, i = 0; i < len; i++) {
            var childComponent = component.children[i];
            raintime.ComponentRegistry.preRegister(childComponent);
            placeholderTimeout(self, childComponent);
        }
    }

    /**
     * Renders the placeholder if the component is not returned in time ( placeholderTimeout )
     *
     * @param {ClientRenderer} self The instance of ClientRenderer
     * @param {Object} placeholder The placeholder component
     * @memberOf ClientRenderer#
     * @private
     */
    function placeholderTimeout(self, placeholder){
        setTimeout(function() {
            if (!$('#' + placeholder.instanceId).hasClass('app-container')) {
                self.renderPlaceholder(placeholder.instanceId);
            }
        }, self.placeholderTimeout);
    };

    /**
     * Load css files and insert html after the css files are completely loaded.
     * Maybe there is a better way. This works on IE8+, Chrome, FF, Safari.
     *
     * @param {ClientRenderer} self The instance of ClientRenderer
     * @param {Array} css CSS dependencies
     * @param {Function} callback Is invoked after all css dependencies are loaded
     * @memberOf ClientRenderer#
     * @private
     */
    function loadCSS(self, css, callback) {
        var head = $('head');
        var loadedFiles = 0;
        for ( var i = 0, len = css.length; i < len; i++) {
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
                head.append(link);
                loader.src = css[i];
            }
        }
    }

    /**
     * Export as a global
     */
    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
