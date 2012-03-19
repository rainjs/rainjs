define(function() {
    /**
     * Creates a DefaultController component instance.
     *
     * @name DefaultController
     * @class DefaultController controller class
     * @constructor
     */
    function DefaultController() {
        // constructor logic here
    }

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @function
     */
    DefaultController.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @function
     */
    DefaultController.prototype.start = $.noop;

    return DefaultController;
});
