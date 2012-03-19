"use strict";

/**
 * Connect store mock implementation.
 *
 * Uses a public ``sessions`` property to store sessions indexed by session ids.
 * Simulates memory store by using asynchronous set and get methods.
 *
 * @property {Object} sessions the list of sessions indexed by session ids
 */
var MockStore = module.exports = function () {
    this.sessions = {};
};

/**
 * Saves a session asynchronously to the store.
 *
 * @param {String} sid the session id
 * @param {Object} sess the session to save
 * @param {Function} fn the callback that gets invoked when the session is saved
 */
MockStore.prototype.set = function (sid, sess, fn) {
    var self = this;
    process.nextTick(function () {
        self.sessions[sid] = sess;
        fn && fn();
    });
};

/**
 * Reads a session asynchronously from the store.
 * Calls the callback with max two parameters: an error or null and the read session object.
 * Both parameters can be missing when there is no stored session with the given session id.
 *
 * @param {String} sid the session id
 * @param {Function} fn the callback that gets invoked when the session is saved
 */
MockStore.prototype.get = function (sid, fn) {
    var self = this;
    process.nextTick(function () {
        var sess = self.sessions[sid];
        if (sess) {
            fn(null, sess);
        } else {
            fn();
        }
    });
};

/**
 * Destroys the session asynchronously.
 *
 * @param {String} sid the session id
 * @param {Function} fn the callback that gets invoked when the session is destroyed
 */
MockStore.prototype.destroy = function (sid, fn) {
    var self = this;
    process.nextTick(function () {
        delete self.sessions[sid];
        fn && fn();
    });
};
