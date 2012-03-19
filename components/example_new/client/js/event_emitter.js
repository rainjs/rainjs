define([], function () {
    /**
     * Event emitter example controller.
     *
     * @name EventEmitter
     * @class a controller instance
     * @constructor
     */
    function EventEmitter() {}

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     *
     * @function
     */
    EventEmitter.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    EventEmitter.prototype.start = function () {
        var self = this;

        var root = self.context.getRoot();
        var events = root.find('.events');
        events.append('<li>The component was started.</li>');

        setTimeout(function () {
            events.append('<li>Emitting the custom event "ready" in 3 seconds!</li>');

            setTimeout(function () {
                self.emit('ready');
            }, 3000);

            self.on('ready', function () {
                events.append('<li><div>The "ready" event was received.</li>');
            });
        }, 2000);
    };

    return EventEmitter;
});
