define([""], function() {
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
    Controller.prototype.init = function () {
        console.log('example component (view nasty_level2) was initialized.');
    };

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @function
     */
    Controller.prototype.start = function () {
        console.log('example component (view nasty_level2) was started.');
    };

    return Controller;
});
