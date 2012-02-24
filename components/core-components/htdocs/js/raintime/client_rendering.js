define(function() {
    /**
     * Get a new instance for ClientRenderer.
     *
     * @class Handles the asynchronous rendering of components.
     * @name ClientRenderer
     * @constructor
     */
    function ClientRenderer() {
        this.uniqueWrapperId = 0;
    }

    /**
     * Loads a component from the server.
     *
     * @param {Object} options
     */
    ClientRenderer.prototype.loadComponent = function(options) {
        if (!options.selector) {
            throw "Selector is required";
        }

        options.wrapperId = this.createTemporarWrapper(options.selector);

        $.ajax({
            url: '/components/client_renderer/controller/serverside.js',
            dataType: 'jsonp',
            data: options
        });
    };

    ClientRenderer.prototype.createTemporarWrapper = function(selector) {
        var uWrapperId = "wrapperid-" + this.uniqueWrapperId++;
        $(selector).after('<div data-instanceid="' + uWrapperId + '"></div>');

        return uWrapperId;
    };

    /**
     * Renders a component received via JSONP.
     *
     * @param {Object} component the component to be rendered
     */
    ClientRenderer.prototype.renderComponent = function(component) {
        console.log(component);
    };

    /**
     * Inserts the component in the page
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} component the component to be rendered
     */
    function insertComponent(self, component) {

    }

    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
