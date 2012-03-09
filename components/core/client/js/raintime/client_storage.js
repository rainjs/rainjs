define(['core/js/lib/amplify.store'
], function (driver) {

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

    /**
     * Creates a new client storage for the current context.
     *
     * @name ClientStorage
     * @class The client storage
     * @constructor
     *
     * @param {Context} context the context of the component.
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

    // TODO: addListener and removeListener function

    return ClientStorage;
});
