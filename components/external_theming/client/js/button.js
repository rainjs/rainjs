define(['raintime/messaging/intents', '/external_theming/js/jquery_button.js'], function(Intents) {
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
        $(this.context.getRoot().children()[0]).button().on('click', '.do-intent', function (event) {
            Intents.send({
                category: 'com.rain.test',
                action: 'DO_SOMETHING'
            });

            Intents.send({
                category: 'com.rain.test',
                action: 'LOG_MESSAGE',
                context: {
                    message: 'Hello from the client-side'
                }
            });

            event.stopImmediatePropagation();
        });
    };

    return Controller;
});
