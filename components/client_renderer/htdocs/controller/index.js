define([], function() {
    /**
     * Example controller class.
     *
     * @name Controller
     * @class a controller instance
     * @constructor
     */
    function Controller() {
        // constructor logic here
    }

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @function
     */
    Controller.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @function
     */
    Controller.prototype.start = function () {
        clientRenderer.loadComponent({
            component: {
                name: 'button',
                version: '1.0',
                view: 'index'
            }
        })
    };

    return Controller;
});
