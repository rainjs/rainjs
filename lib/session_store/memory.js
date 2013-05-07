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

var util = require('util'),
    BaseSessionStore = require('../base_session_store'),
    MemorySession = require('../base_session'),
    logger = require('../logging').get(),
    Promise = require('promised-io/promise');

function MemoryStore(storeConfig) {
    this._sessionCollection = {};
    BaseSessionStore.call(this, storeConfig);
};

util.inherits(MemoryStore, BaseSessionStore);

MemoryStore.prototype.get = function (sessionId, componentId) {
    var deferred = Promise.defer(),
        session,
        sessionData = {};

    if (!this._sessionCollection[sessionId]) {
        if(componentId) {
            session = new MemorySession(undefined, componentId);
        } else {
            session = new MemorySession();
        }

        session.id = sessionId;
    } else {
        sessionData.id = this._sessionCollection[sessionId].id;
        sessionData.global = this._sessionCollection[sessionId].global;
        if(componentId) {
            sessionData.components = this._sessionCollection[sessionId].components;
            session = new MemorySession(sessionData.components[componentId], componentId);
        } else {
            session = new MemorySession(sessionData.global);
        }
    }

    process.nextTick(function () {
        deferred.resolve(session);
    });

    return deferred.promise;
};

MemoryStore.prototype.createNewSession = function (sessionId) {
    var deferred = Promise.defer();

    this._sessionCollection[sessionId] = {
        id: sessionId,
        global: {},
        components: {}
    };

    var session = new MemorySession();
    session.id = sessionId;

    process.nextTick(function () {
        deferred.resolve(session);
    });

    return deferred.promise;
};

MemoryStore.prototype.save = function (session) {
    var deferred = Promise.defer(),
        key;

    if (session.id && typeof session._componentId !== 'undefined' &&
            !this._sessionCollection[session.id][session._componentId]) {
        this._sessionCollection[session.id].components[session._componentId] = {};
    }

    if (session._updatedKeys.length > 0) {
        for (var i = session._updatedKeys.length; i--;) {
            key = session._updatedKeys[i];
            if(session._componentId) {
                this._sessionCollection[session.id].components[session._componentId][key] = session._session[key];
            } else {
                this._sessionCollection[session.id].global[key] = session._session[key];
            }
        }
    }

    if (session._removedKeys.length > 0) {
        for (var i = session._removedKeys.length; i--;) {
            if(session._componentId) {
                delete this._sessionCollection[session.id].components[session._componentId][session._removedKeys[i]];
            } else {
                delete this._sessionCollection[session.id].global[session._removedKeys[i]];
            }
        }
    }

    process.nextTick(function () {
        deferred.resolve();
    });

    return deferred.promise;

};

MemoryStore.prototype.destroy = function (sessionId) {
    var deferred = Promise.defer();

    delete this._sessionCollection[sessionId];

    process.nextTick(function () {
        deferred.resolve();
    });

    return deferred.promise;

};

module.exports = MemoryStore;
