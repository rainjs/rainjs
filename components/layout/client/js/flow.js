define(['util', 'layout/1.0/js/layout'], function (Util, Layout) {

    /**
     * This is the client-side implementation of the flow layout.
     *
     * @name FlowLayout
     * @class
     * @constructor
     *
     * @property {String} orientation='ltr' the items orientation: left to right or right to left (rtl)
     */
    function FlowLayout() {
        Layout.call(this);
    }

    Util.inherits(FlowLayout, Layout);

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     */
    FlowLayout.prototype.start = function () {
        var root = this.context.getRoot();

        this._container = root.find('.flow-container');
        this._items = this._container.find('.item');

        this.orientation = this._container.attr('data-orientation') || 'ltr';
    };

    /**
     * Create a new item placeholder.
     *
     * @param {Object} options parameters needed to know how to configure the place for the component
     * @param {Number} index the index where the new item will be placed
     * @throws {RainError} if start wasn't executed when the method was called
     * @returns {jQueryObject} the element where the new component can be inserted
     */
    FlowLayout.prototype._createNewItem = function (options) {
        if (!this._container) {
            throw new RainError('API methods cannot be called before start is executed',
                                RainError.ERROR_PRECONDITION_FAILED);
        }

        var index = options.index;
        if (!index || index < 0 || index > this._items.length) {
            if (this.orientation == 'ltr') {
                index = this._items.length;
            } else {
                index = 0;
            }
        }

        var item = '<div class="item"></div>';
        if (this._items.length == 0) {
            this._container.html(item);
        } else if (index == 0) {
            $(item).insertBefore(this._items[0]);
        } else {
            $(item).insertAfter(this._items[index - 1]);
        }

        this._items = this._container.find('.item');

        return this._items[index];
    };

    /**
     * Remove a component from the layout.
     *
     * @param {Object} options parameters to identify what will be removed
     * @throws {RainError} if start wasn't executed when the method was called
     */
    Layout.prototype._remove = function (options) {
        if (!this._container) {
            throw new RainError('API methods cannot be called before start is executed',
                                RainError.ERROR_PRECONDITION_FAILED);
        }

        var index = options.index;
        if (!index) {
            throw new RainError('The "index" parameter is missing.',
                                RainError.ERROR_PRECONDITION_FAILED);
        }

        if (index >= 0 && index < this._items.length) {
            $(this._items[index]).remove();
            delete this._items[index];
        }
    };

    return FlowLayout;
});
