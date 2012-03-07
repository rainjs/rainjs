define([
    'core/js/promised-io/promise',
    'core/js/raintime/messaging',
    'core/js/raintime/raintime'
], function(Promise, messaging, raintime) {
    function ClientRenderer() {
        this.placeholderComponent = null;
        this.placeholderTimeout = 500;

        var socket = messaging.getWebSocket('/core');
        socket.on('render', this.renderComponent);
    }

    ClientRenderer.prototype.setPlaceholder = function (component) {
        this.placeholderComponent = component;
    };

    ClientRenderer.prototype.setPlaceholderTimeout = function (milliseconds) {
        this.placeholderTimeout = milliseconds;
    };

    ClientRenderer.prototype.renderComponent = function (component, instanceId) {
        component.instanceId = instanceId || component.instanceId;
        var componentPromise = raintime.ComponentRegistry.register(component);
        insertComponent(this, component, instanceId || component.instanceId);
    };

    ClientRenderer.prototype.renderPlaceholder = function(instanceId) {
        this.renderComponent(this.placeholderComponent, instanceId);
    };

    function insertComponent(self, component, instanceId) {
        var domElement = $('#' + instanceId);
        domElement.hide();
        domElement.html(component.html);
        domElement.attr('id', component.instanceId);
        domElement.attr('class', 'app-container ' + component.componentId + '_'
                                 + component.version.replace(/[\.]/g, '_'));
        loadCSS(this, component.css, function() {
            domElement.show();
        });
        for (var len = component.children.length, i = 0; i < len; i++) {
            var instanceIdChild = component.children[i].instanceId;
            setTimeout(function() {
                if (!$('#' + instanceIdChild).hasClass('app-container')) {
                    self.renderPlaceholder(instanceIdChild);
                }
            }, self.placeholderTimeout);
        }
    }

    /**
     * Load css files and insert html after the css files are completely loaded.
     * Maybe there is a better way. This works on IE8+, Chrome, FF, Safari.
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

    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
