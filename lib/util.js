util = module.exports = require('util');

util.freezeRecursive = function (obj) {
    var prop, value;
    for (prop in obj) {
        value = obj[prop];

        if (typeof value === 'object') {
            util.freezeRecursive(value);

            Object.freeze(value);
        }
    }
};

