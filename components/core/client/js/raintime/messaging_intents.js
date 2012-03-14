/*
Copyright (c) 2011, Cosnita Radu Viorel <radu.cosnita@1and1.ro>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.
* Neither the name of the <organization> nor the
names of its contributors may be used to endorse or promote products
derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * @author Radu Viorel Cosnita
 * @version 1.0
 * @since 21.11.2011
 * @description This module provides intents client methods that are automatically
 * binded to messaging layer.
 */

define(["core/js/client_util",
        "core/js/event_emitter",
        "core/js/socket.io/socket.io",
        "core/js/promised-io/promise",
        "core/js/jquery-cookie"], function(ClientUtil, EventEmitter, SocketIO, Promise) {
    /**
     * Class used to implement client intents object.
     *
     * @name ClientIntents
     * @class
     * @constructor
     */
    function ClientIntents(config) {
        this._config = {};

        var webSocketsCfg = config.rain_websockets;

        var intentsUrl = this._getIntentsSocketUrl(webSocketsCfg);

        this._intentsSocket = SocketIO.io.connect(intentsUrl);

        this._requestCounter = 0;

        // this attribute keeps track of intents sent from a specific context.
        this._intentsContext = {};

    }

    ClientUtil.inherits(ClientIntents, EventEmitter);

    ClientIntents.INTENT_SOCKET = "/intents";
    ClientIntents.INTENT_SENT = 1;
    ClientIntents.INTENT_RECEIVED_ERR = 2;
    ClientIntents.INTENT_CONTEXTS_CHANGED = "intents_changed";
    ClientIntents.INTENTS_CONTEXT_READY = "intents_context_ready";

    /**
     * Class used to obtain the intents socket url from the configuration.
     */
    ClientIntents.prototype._getIntentsSocketUrl = function(webSocketsCfg) {
        var intentsUrl = [];

        intentsUrl.push(webSocketsCfg.rain_websockets_url);
        intentsUrl.push(":");
        intentsUrl.push(webSocketsCfg.rain_websockets_port);
        intentsUrl.push(webSocketsCfg.rain_websockets_namespace);
        intentsUrl.push(ClientIntents.INTENT_SOCKET);

        return intentsUrl.join("");
    };

    /**
     * Method used to send an intent request.
     *
     * @name sendIntent
     * @function
     * @param {Dictionary} request This is the request object for this intent.
     * @param {Promise} defer
     * @return {Promise} A promise that provide then method. You can use it for react to success and error situations.
     * @throws {Error} if request object is incomplete then sendIntent raises an error.
     *
     * @example:
     * var request = {"viewContext": <viewcontext instance>,
     *                "category": "....",
     *                "action": "....",
     *                "intentContext": {....},
     *                "success": function(data) {.....},
     *                "error": function(error) {....}};
     *
     * clientRuntime.messaging.sendIntent(request);
     */
    ClientIntents.prototype.sendIntent = function(request, defer) {
        if(!this._validateIntentRequest(request, defer)) {
            return;
        }

        var defer = new Promise.defer();

        this._requestCounter++;

        var session = ClientUtil.getSession();
        var requestId = this._requestCounter;

        request.session = session;
        request.requestId = requestId;

        this._requestIntent(request, defer);
        this._handleError(request, defer);
        this._handleIntentLoaded(request, defer);

        return defer.promise;
    };

    /**
     * Method used to validate the requests object.
     */
    ClientIntents.prototype._validateIntentRequest = function(request, defer) {
        var ex;

        if(!request.viewContext) {
            ex = new Error("View context not specified.");
        } else if(!request.category) {
            ex = new Error("Intent category not specified.");
        } else if(!request.action) {
            ex = new Error("Intent action not specified.");
        }

        if(ex) {
            defer.reject(ex);

            return false;
        }

        return true;
    };

    /**
     * Method used to emit an request intent event.
     */
    ClientIntents.prototype._requestIntent = function(request, defer) {
        var contextId = this.__getContextId(request);

        this._intentsSocket.emit("request_intent",
                {
                    intentCategory: request.category,
                    intentAction: request.action,
                    intentContext: request.intentContext || {},
                    session: request.session,
                    requestId: request.requestId
                });

        if(!this._intentsContext[contextId]) {
            this._intentsContext[contextId] = {};
        }

        this._intentsContext[contextId][request.requestId] = {"status": ClientIntents.INTENT_SENT};

        this.emit(ClientIntents.INTENT_CONTEXTS_CHANGED, this._intentsContext[contextId],
                request.viewContext);
    };

    /**
     * Method used to obtain the context id from which the request is sent.
     *
     * @param {Dictionary} request: the intent request object.
     * @param {ViewContext} viewContext: an optional view context to use for obtaining the id.
     */
    ClientIntents.prototype.__getContextId = function(request, viewContext) {
        viewContext = viewContext || request.viewContext;

        return viewContext.moduleId + "@" + viewContext.instanceId;
    };

    /**
     * Method used to handle intent_loaded event.
     */
    ClientIntents.prototype._handleIntentLoaded = function(request, defer) {
        var self = this;

        this._intentsSocket.on("intent_loaded", function(intentResponse) {
            if(request.requestId == intentResponse.requestId) {
                if (intentResponse.data.intentType === "view") {
                    request.viewContext.viewManager.displayView(intentResponse.data, true);
                }

                var contextId = self.__getContextId(request);
                var context = self._intentsContext[contextId];

                delete context[request.requestId];

                self.emit(ClientIntents.INTENT_CONTEXTS_CHANGED, context, request.viewContext);

                if(JSON.stringify(context) == "{}") {
                    self.emit(ClientIntents.INTENTS_CONTEXT_READY, request.viewContext);
                }

                defer.resolve(intentResponse.data);
            }
        });
    };

    /**
     * Method used to determine if all intents for a specified view context
     * are ready or not.
     */
    ClientIntents.prototype.isReady = function(viewContext) {
        var contextId = this.__getContextId(undefined, viewContext);

        var context = this._intentsContext[contextId];

        return JSON.stringify(context) == "{}";
    };

    /**
     * Method used to handle error received from the intents socket.
     */
    ClientIntents.prototype._handleError = function(request, defer) {
        var self = this;

        this._intentsSocket.on("intent_exception", function(intentResponse) {
           if(request.requestId == intentResponse.requestId) {
                   var contextId = self.__getContextId(request);

                self._intentsContext[contextId][request.requestId] = {"status": ClientIntents.INTENT_RECEIVED_ERR};

                self.emit(ClientIntents.INTENT_CONTEXTS_CHANGED, self._intentsContext[contextId], request.viewContext);

                defer.reject(intentResponse.message);
           }
        });
    };

    return ClientIntents;
});
