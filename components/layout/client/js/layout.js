define(function () {

    /**
     * Abstract controller for layout controllers.
     *
     * @name Layout
     * @class
     * @constructor
     */
    function Layout() {}

    /**
     * Add a component or a string content to the layout.
     *
     * @param {Object|String} component the component to add or the string to insert
     * @param {String} component.id the component id
     * @param {String} component.version the component version
     * @param {String} component.view the component view id
     * @param {String} [component.sid] the component staticId id
     * @param {Object} [component.context] custom data for the component
     * @param {Boolean} [component.placeholder] enable / disable placeholder
     * @param {Object} options parameters needed to know how to configure the place for the component
     * @param {Function} [callback] the function that will be called after the component was added
     */
    Layout.prototype.add = function (component, options, callback) {
        var container = this._createNewItem(options || {});

        if (typeof component === 'string') {
            container.html(component);
            callback && callback(this);
        } else {
            this.context.insert(component, container, function () {
                callback && callback(this);
            });
        }
    };

    /**
     * Remove a component from the layout.
     *
     * @param {Object} options parameters to identify what will be removed
     */
    Layout.prototype.remove = function (options) {
        this._remove(options || {});
    };

    return Layout;
});
