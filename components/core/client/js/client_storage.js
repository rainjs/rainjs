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
