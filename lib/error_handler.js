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

var path = require('path');
var fs = require('fs');
var componentRegistry = require("./component_registry");
var config = require('./configuration');

/**
 * Creates the ErrorHandler and loads the specified / default error component.
 *
 * @name ErrorHandler
 * @class
 * @constructor
 * @throws {RainError} when the error component is not specified or if it doesn't have the default view
 */
var ErrorHandler = function ErrorHandler() {
    var component = config.errorComponent;
    component.version = componentRegistry.getLatestVersion(component.id, component.version);
    if (component.version) {
        this.component = componentRegistry.getConfig(component.id, component.version);
        if (!this.component.views['default']) {
            throw new RainError('The error component doesn\'t have a default view!',
                                null, RainError.ERROR_PRECONDITION_FAILED);
        }
    } else {
        throw new RainError('No error component specified or default doesn\'t exist!',
                            null, RainError.ERROR_IO);
    }
};

/**
 * Renders an error view from a given status code.
 *
 * @param {Integer} statusCode the status code for the error
 * @returns {Object} The component and view for the status code
 */
ErrorHandler.prototype.getErrorComponent = function (statusCode) {
    if (!this.component.views[statusCode]) {
        statusCode = 'default';
    }

    return {
        component: this.component,
        view: statusCode
    };
};

module.exports = new ErrorHandler();
