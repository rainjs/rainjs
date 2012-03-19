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
        events.append('<div>The component was started.</div>');

        setTimeout(function () {
            events.append('<div>Emitting the custom event "ready" in 3 seconds!</div>');

            setTimeout(function () {
                self.emit('ready');
            }, 3000);

            self.on('ready', function () {
                events.append('<div>The "ready" event was received.</div>');
            });
        }, 2000);
    };

    return EventEmitter;
});
