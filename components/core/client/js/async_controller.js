define(['raintime/lib/promise',
        'raintime/lib/step'],
    function (Promise, Step) {

    var step = Step.Step,
        allKeys = Promise.allKeys,
        defer = Promise.defer;

    function AsyncController() {
        /**
         * Controllers for child components.
         * @type {Array}
         */
        this._controllers = [];
    }

    /**
     * Asynchronously waits for a child controller to become available and start.
     *
     * @param {String} sid the child component's SID
     * @returns {Promise} a promise to return the child controller after it has started
     */
    AsyncController.prototype._getController = function (sid) {
        var d = defer(),
            self = this;

        this.context.find(sid, function () {
            this.on('start', function () {
                self._controllers[sid] = this;
                d.resolve(this);
            });
        });

        return d.promise;
    };

    /**
     * Returns a child component's controller based on it's SID.
     * Tries the cache first, otherwise waits for it to be available.
     *
     * @param {String} sid the child component's SID
     * @returns {Controller|Promise} the requested child controller or a promise
     */
    AsyncController.prototype._get = function (sid) {
        return this._controllers[sid] || this._getController(sid);
    };

    /**
     * Convenience method to bind an event handler to a controller
     * and make sure the controller is loaded first.
     *
     * @param {String} sid the component's SID
     * @param {String} e the event's name
     * @param {Function} fn the event handler
     */
    AsyncController.prototype._on = function (sid, e, fn) {
        step(this, [
            function () {
                return this._get(sid);
            },
            function (c) {
                c.on(e, fn);
            }
        ]);
    };

    /**
     * Asynchronously loads multiple controllers.
     * Accepts multiple SID arguments.
     *
     * @returns {Promise} a promise to load all controllers
     */
    AsyncController.prototype._all = function () {
        var keys = {};

        for (var i = 0, l = arguments.length; i < l; i++) {
            var sid = arguments[i];
            keys[sid] = this._get(sid);
        }

        return allKeys(keys);
    };

    return AsyncController;
});
