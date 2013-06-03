define(['raintime/lib/util', 'js/layout'], function (Util, Layout) {
    "use strict";

    /**
     * Implements flow layout behavior.
     * Inside a flow layout, items float from left to right.
     *
     * @name FlowLayout
     * @constructor
     * @augments Layout
     * @borrows Layout.add as #add
     */
    function FlowLayout() {
        Layout.call(this);
    }

    Util.inherits(FlowLayout, Layout);

    /**
     * Startup lifecycle step that happens right after the markup is in place.
     * @private
     */
    FlowLayout.prototype.start = function () {
        var root = this.context.getRoot();

        this._container = root.find('.flow-container');
        this._items = this._container.find('.item');
    };

    /**
     * Creates a new item block.
     *
     * @param {Object} options specific configuration for the content's item block
     * @param {Number} [options.index] the index where the new item will be placed
     * @throws {RainError} if start wasn't executed when the method was called
     * @returns {jQuery} the element where the new component can be inserted
     */
    FlowLayout.prototype._createNewItem = function (options) {
        if (!this._container) {
            throw new RainError('API methods cannot be called before start is executed',
                                RainError.ERROR_PRECONDITION_FAILED);
        }

        var index = options.index;
        if (typeof index === 'undefined' || index < 0 || index > this._items.length) {
            index = this._items.length;
        }

        var item = $('<div class="item"></div>');
        if (this._items.length === 0) {
            this._container.append(item);
        } else if (index === 0) {
            item.insertBefore(this._items[0]);
        } else {
            item.insertAfter(this._items[index - 1]);
        }

        this._items.splice(index, 0, item);

        return item;
    };

    /**
     * Removes an item from the layout.
     *
     * @param {Object} options configuration to identify the item block to be removed
     * @param {Number} options.index the index to remove
     * @throws {RainError} if start wasn't executed when the method was called
     */
    FlowLayout.prototype.remove = function (options) {
        options = options || {};

        if (!this._container) {
            throw new RainError('API methods cannot be called before start is executed',
                                RainError.ERROR_PRECONDITION_FAILED);
        }

        var index = options.index;
        if ('undefined' === typeof index) {
            throw new RainError('The "index" parameter is missing.',
                                RainError.ERROR_PRECONDITION_FAILED);
        }

        if (index >= 0 && index < this._items.length) {
            $(this._items[index]).remove();
            this._items.splice(index, 1);
        }
    };

    /**
     * Gets the number of existing items.
     *
     * @throws {RainError} if start wasn't executed when the method was called
     * @returns {Number} the number of items
     */
    FlowLayout.prototype.count = function () {
        if (!this._container) {
            throw new RainError('API methods cannot be called before start is executed',
                                RainError.ERROR_PRECONDITION_FAILED);
        }

        return this._items.length;
    };

    return FlowLayout;
});
