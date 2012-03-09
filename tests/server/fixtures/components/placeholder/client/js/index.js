define(function() {
    /**
     * Creates a Placeholder instance.
     *
     * @name Placeholder
     * @class Placeholder controller class.
     * @constructor
     */
    function Placeholder() {}

    Placeholder.prototype.init = function () {
        console.log("Placeholder was initialized.");
    }

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    Placeholder.prototype.start = function () {
        console.log('Placeholder was started.');
    };

    return Placeholder;
});
