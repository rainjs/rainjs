"use strict";

var IdentityProvider = require('./identity_provider'),
    Deferred = require('promised-io/promise').Deferred,
    util = require('util');

/**
 * Demo implementation of the Identity Provider class
 *
 * @name DemoIdentityProvider
 * @param {Session} session the session for which to create the identity provider instance
 * @constructor
 */
function DemoIdentityProvider(session) {
    DemoIdentityProvider.super_.call(this, session);
}

util.inherits(DemoIdentityProvider, IdentityProvider);

/**
 * Authenticates the user
 *
 * @param {String} username the username
 * @param {String} password the password
 * @returns {Promise} a promise that resolves with the user object
 */
DemoIdentityProvider.prototype._authenticate = function (username, password) {
    var deferred = new Deferred();

    process.nextTick(function () {
        deferred.resolve({
            id: 0,
            username: 'Guest',
            permissions: []
        });
    });

    return deferred;
};

module.exports = DemoIdentityProvider;
