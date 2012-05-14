// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

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
