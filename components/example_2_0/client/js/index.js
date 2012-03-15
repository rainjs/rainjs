define(['core/js/messaging/intents'], function(Intents) {
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
        $(this.context.getRoot).on('click', '.do-intent', function (event) {
            Intents.send({
                category: 'com.rain.test',
                action: 'DO_SOMETHING'
            });
            event.stopImmediatePropagation();
        });
    };

    return Controller;
});
