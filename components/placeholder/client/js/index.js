define(function() {
    /**
     * Creates a Placeholder instance.
     *
     * @name Placeholder
     * @class Placeholder controller class.
     * @constructor
     */
    function Placeholder() {}

    /**
     * Initialization lifecycle step that happens immediately after the controller is loaded.
     */
    Placeholder.prototype.init = $.noop;

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    Placeholder.prototype.start = $.noop;

    return Placeholder;
});
