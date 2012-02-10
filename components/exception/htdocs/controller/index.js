define([], function() {
    /**
     * Exception controller class
     * @name Controller
     * @class a controller instance
     * @constructor
     */
    function Controller() {
        // constructor logic here
    }

    /**
     * Initialisation lifecycle step that happens immediately after the controller is loaded
     */
    Controller.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place
     */
    Controller.prototype.start = $.noop;

    return Controller;
});
