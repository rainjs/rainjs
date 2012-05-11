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

define(['raintime/lib/amplify.store'], function (driver) {

    var storageTypes = {
        'persistent': [
            'localStorage',
            'globalStorage',
            'userData'
        ],
        'transient': [
            'sessionStorage',
            'memory'
        ]
    };

    /**
     * Creates a new client storage for the current context.
     *
     * It provides methods to work with the client data. The storage methods can be used directly
     * from the the controller's context through the *storage* key.
     *
     * @name ClientStorage
     * @class The client storage
     * @constructor
     * @param {Context} context the context of the component.
     *
     * @example
     *     this.context.storage.set('cart', { items: [1, 2, 3, 4], total: 10});
     *     var data = this.context.storage.get('cart');
     *     console.log(data);
     *
     *     // That will print
     *     //     {
     *     //         items: [1, 2, 3, 4],
     *     //         total: 10
     *     //     }
     */
    function ClientStorage(context) {
        this.context = context;
    }

    /**
     * Sets the value of a key (add it if key doesn't exist) into storage.
     *
     * @param {String} key the key
     * @param {Object} value the value
     * @param {Boolean} [isTransient='false'] whether to use persistent storage or transient storage
     */
    ClientStorage.prototype.set = function (key, value, isTransient) {
        var storage = getStorage(isTransient);

        storage(key, value, {expires: false});
    };

    /**
     * Retrieves the value of a key from storage.
     *
     * @param {String} key the key
     * @param {Boolean} [isTransient='false'] whether to use persistent storage or transient storage
     * @returns {Object} the key value
     */
    ClientStorage.prototype.get = function (key, isTransient) {
        var storage = getStorage(isTransient);

        return storage(key);
    };

    /**
     * Removes a key from storage.
     *
     * @param {String} key the key
     * @param {Boolean} [isTransient='false'] whether to use persistent storage or transient storage
     */
    ClientStorage.prototype.remove = function (key, isTransient) {
        var storage = getStorage(isTransient);

        storage(key, null);
    };

    function getStorage(type) {
        type = (type) ? 'transient' : 'persistent';

        for (var i in storageTypes[type]) {
            var storage = storageTypes[type][i];

            if(storage in driver.store.types) {
                return driver.store.types[storage];
            }
        }

        return driver.store;
    }

    // TODO: addListener and removeListener function

    return ClientStorage;
});
