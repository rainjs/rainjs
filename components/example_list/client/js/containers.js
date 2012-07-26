define([], function () {

    /**
     * This is the client-side controller for the 'round' page.
     *
     * @name RoundCorners
     * @class
     * @constructor
     */
    function Containers() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    Containers.prototype.start = function () {
        this.context.find('notes', function (notes) {
            notes.on('start', function () {
                alert('The number of notes is: ' + notes.count());
            });
        });
    };

    return Containers;
});
