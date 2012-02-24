define(function () {
    /**
     * This class handles the asynchronous rendering of components
     *
     * @class
     * @constructor
     */
    function ClientRenderer() {
    }

    /**
     * Loads a component from the server
     *
     * @param {Object} options
     */
    ClientRenderer.prototype.loadComponent = function (options) {
    };

    /**
     * Renders a component recived via JSONP
     *
     * @param {Object} component the component to be rendered
     */
    ClientRenderer.prototype.renderComponent = function (component) {
    };

    window.ClientRenderer = ClientRenderer;

    return ClientRenderer;
});
