define(function() {

    var isArray = Array.isArray;

    /**
     * When an EventEmitter instance experiences an error, the typical action is to emit an 'error' event.
     * Error events are treated as a special case in node.
     * If there is no listener for it, then the default action is to print a stack trace and exit the program.
     * All EventEmitters emit the event 'newListener' when new listeners are added.
     *
     * @class EventEmitter
     */
    function EventEmitter() {}

    var defaultMaxListeners = 10;
    /**
     * By default EventEmitters will print a warning if more than 10 listeners are added for a particular event.
     * This is a useful default which helps finding memory leaks.
     * Obviously not all Emitters should be limited to 10. This function allows that to be increased.
     * Set to zero for unlimited.
     *
     * @param {Number} n
     */
    EventEmitter.prototype.setMaxListeners = function (n) {
        if (!this._events) {
            this._events = {};
        }
        this._maxListeners = n;
    };

    /**
     * Execute each of the listeners in order with the supplied arguments.
     *
     * @param {String} event The event name
     * @param [arg,arg2] The arguments to pass
     */
    EventEmitter.prototype.emit = function () {
        var type = arguments[0];
        // If there is no 'error' event listener then throw.
        if (type === 'error') {
            if (!this._events || !this._events.error ||
                (isArray(this._events.error) && !this._events.error.length)) {
                if (arguments[1] instanceof Error) {
                    throw arguments[1]; // Unhandled 'error' event
                } else {
                    throw new Error("Uncaught, unspecified 'error' event.");
                }
                return false;
            }
        }

        if (!this._events) {
            return false;
        }
        var handler = this._events[type];
        if (!handler) {
            return false;
        }

        if (typeof handler == 'function') {
            switch (arguments.length) {
                // fast cases
                case 1:
                    handler.call(this);
                    break;
                case 2:
                    handler.call(this, arguments[1]);
                    break;
                case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                // slower
                default:
                    var l = arguments.length;
                    var args = new Array(l - 1);
                    for (var i = 1; i < l; i++) {
                        args[i - 1] = arguments[i];
                    }
                    handler.apply(this, args);
            }
            return true;

        } else if (isArray(handler)) {
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) {
                args[i - 1] = arguments[i];
            }

            var listeners = handler.slice();
            for (var i = 0, l = listeners.length; i < l; i++) {
                listeners[i].apply(this, args);
            }
            return true;

        } else {
            return false;
        }
    };

    /**
     * Adds a listener to the end of the listeners array for the specified event.
     *
     * @param {String} type The event name
     * @param {Function} listener The listener function
     * @returns {EventEmitter}
     */
    EventEmitter.prototype.addListener = function (type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('addListener only takes instances of Function');
        }

        if (!this._events) {
            this._events = {};
        }

        // To avoid recursion in the case that type == "newListeners"! Before
        // adding it to the listeners, first emit "newListeners".
        this.emit('newListener', type, typeof listener.listener === 'function' ?
                   listener.listener : listener);

        if (!this._events[type]) {
            // Optimize the case of one listener. Don't need the extra array object.
            this._events[type] = listener;
        } else if (isArray(this._events[type])) {

            // If we've already got an array, just append.
            this._events[type].push(listener);

        } else {
            // Adding the second element, need to change to array.
            this._events[type] = [this._events[type], listener];
        }

        // Check for listener leak
        if (isArray(this._events[type]) && !this._events[type].warned) {
            var m;
            if (this._maxListeners !== undefined) {
                m = this._maxListeners;
            } else {
                m = defaultMaxListeners;
            }

            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
            }
        }

      return this;
    };

    /**
     * Adds a listener to the end of the listeners array for the specified event.
     * This is a shortcut for the method ``addListener``
     *
     * @param {String} type The event name
     * @param {Function} listener The listener function
     * @returns {EventEmitter} Instance
     */
    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    /**
     * Adds a one time listener for the event.
     * This listener is invoked only the next time the event is fired, after which it is removed.
     *
     * @param {String} type The event name
     * @param {Function} listener The listener function
     * @returns {EventEmitter} Instance
     */
    EventEmitter.prototype.once = function (type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('.once only takes instances of Function');
        }

        var self = this;
        function g() {
            self.removeListener(type, g);
            listener.apply(this, arguments);
        };

        g.listener = listener;
        self.on(type, g);

        return this;
    };

    /**
     * Remove a listener from the listener array for the specified event.
     * **Caution**: changes array indices in the listener array behind the listener.
     *
     * @param {String} type The event name
     * @param {Function} listener The listener function
     * @returns {EventEmitter} Instance
     */
    EventEmitter.prototype.removeListener = function (type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('removeListener only takes instances of Function');
        }

        // does not use listeners(), so no side effect of creating _events[type]
        if (!this._events || !this._events[type]) {
            return this;
        }

        var list = this._events[type];

        if (isArray(list)) {
            var position = -1;
            for (var i = 0, length = list.length; i < length; i++) {
                if (list[i] === listener ||
                    (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0) {
                return this;
            }
            list.splice(position, 1);
            if (list.length == 0) {
                delete this._events[type];
            }
        } else if (list === listener ||
                   (list.listener && list.listener === listener)) {
            delete this._events[type];
        }

        return this;
    };

    /**
     * Removes all listeners, or those of the specified event.
     *
     * @param {String} type The event name
     * @returns {EventEmitter} Instance
     */
    EventEmitter.prototype.removeAllListeners = function (type) {
        if (arguments.length === 0) {
            this._events = {};
            return this;
        }

        // does not use listeners(), so no side effect of creating _events[type]
        if (type && this._events && this._events[type]) {
            this._events[type] = null;
        }
        return this;
    };

    /**
     * Returns an array of listeners for the specified event.
     * This array can be manipulated, e.g. to remove listeners.
     *
     * @param {String} type The event name
     * @returns {EventEmitter} Instance
     */
    EventEmitter.prototype.listeners = function(type) {
        if (!this._events) {
            this._events = {};
        }
        if (!this._events[type]) {
            this._events[type] = [];
        }
        if (!isArray(this._events[type])) {
            this._events[type] = [this._events[type]];
        }
        return this._events[type];
    };

    return EventEmitter;
});
