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
        console.log('example component (view nasty_level3) was initialized.');
    };

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     *
     * @function
     */
    Controller.prototype.start = function () {
        console.log('example component (view nasty_level3) was started.');
    };

    /**
     * This view contains an error if it gets data for the template and it
     * will be automatically populated here
     *
     * @function
     */
    Controller.prototype.error = function (error) {
        console.log(error);
    };

    return Controller;
});
