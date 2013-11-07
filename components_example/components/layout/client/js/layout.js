define(function () {
    "use strict";

    /**
     * Abstract controller for layout controllers.
     *
     * Implements functionality to add and remove items to the layout.
     * Subclass to implement specific client behavior.
     *
     * @name Layout
     * @constructor
     */
    function Layout() {}

    /**
     * Adds content to the layout.
     *
     * @param {Object|String} content the component or markup to insert
     * @param {String} content.id the component id
     * @param {String} content.version the component version
     * @param {String} content.view the component view id
     * @param {String} [content.sid] the component staticId id
     * @param {Object} [content.context] custom data for the component
     * @param {Boolean} [content.placeholder] enable / disable placeholder
     * @param {Object} options specific configuration for the content's item block
     * @param {Function} [callback] a function that will be called after the content was added
     */
    Layout.prototype.add = function (content, options, callback) {
        var container = this._createNewItem(options || {});

        if (!container) {
            return;
        } else if (typeof content === 'string') {
            container.html(content);
            callback && callback(this);
        } else {
            this.context.insert(content, container, function () {
                callback && callback(this);
            });
        }
    };

    /**
     * Creates a new item block.
     *
     * @param {Object} options specific configuration for the content's item block
     * @function
     * @returns {jQuery} the element where the new component can be inserted
     */
    Layout.prototype._createNewItem = $.noop;

    /**
     * Removes an item from the layout.
     *
     * @param {Object} options configuration to identify the item block to be removed
     * @function
     */
    Layout.prototype.remove = $.noop;

    return Layout;
});
