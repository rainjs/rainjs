define(function () {
    /**
     * Get a new instance for ClientRenderer.
     *
     * @class Handles the asynchronous rendering of components.
     * @name ClientRenderer
     * @constructor
     */
    function ClientRenderer() {
    }

    /**
     * Loads a component from the server.
     *
     * @param {Object} options
     */
    ClientRenderer.prototype.loadComponent = function (options) {
        $.ajax({
            url: '/components/client_renderer/controller/serverside.js',
            dataType: 'jsonp',
            data: options
        });
    };

    /**
     * Renders a component received via JSONP.
     *
     * @param {Object} component the component to be rendered
     */
    ClientRenderer.prototype.renderComponent = function (component) {
        var component = registerComponent(this, component);
        insertComponent(this, component);

        component.controller.start();
    };

    /**
     * Inserts the component in the page
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} component the component to be rendered
     */
    function insertComponent(self, component) {
        $('#' + component.domId).html(component.html);
        var head = $('head');
        for (var i = 0, l = component.css.length; i < l; i++) {
            head.append('<link rel="stylesheet" href="' + component.css[i] + '" type="text/css" />')
        }
    }

    /**
     * Register a component with the framework
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} component the component to be registered
     */
    function registerComponent(self, component) {
        require(["core-components/raintime/raintime"], function (Raintime) {
            var Registry = Raintime.ComponentRegistry;
            var Controller = Raintime.ComponentController;
            var component = Registry.register({
                "domId": component.domId,
                "instanceId": component.instanceId,
                "moduleId": component.moduleId,
                "staticId": component.staticId,
                "clientcontroller": component.controller
            });

            component.controller.init(); // call the init lifecycle method of the component

            return component;
        });
    }

    function insertComponent(self, component) {
    }

    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
