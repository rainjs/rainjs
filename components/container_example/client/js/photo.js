define([], function () {

    /**
     * Client-side controller for the photo view
     *
     * @name Photo
     * @class
     * @constructor

     */
    function Photo() {}

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    Photo.prototype.start = function () {
        this._root = this.context.getRoot();
        this._caption = this._root.find('.painting-caption');
    };

    /**
     * Gets or sets the title of the photo
     *
     * @param {String} [value] the title value
     * @returns {String|Photo}
     */
    Photo.prototype.title = function (value) {
        if (typeof this._caption === 'undefined') {
            throw new RainError('The method title should be called after start!');
        }

        if (typeof value === 'undefined') {
            return this._caption.html();
        }

        this._caption.html(value);

        return this;
    };

    return Photo;
});