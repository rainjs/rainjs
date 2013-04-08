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

var config = require('rain/lib/configuration'),
    logger = require('../logging').get(),
    path = require('path');


/**
 * Abstract monitoring provider class.
 *
 * @name MonitoringAdapter
 * @constructor
 */
function MonitoringAdapter() {
}

/**
 * Sends data to monitoring tool.
 *
 */
MonitoringAdapter.prototype.sendData = function (data) {
};


/**
 * The adapter instance
 * @type Function
 */
MonitoringAdapter._instance = null;

/**
*
*   Returns the singleton instance.
*
*   @returns {HipRegistry} the singleton instance
*/
MonitoringAdapter.get = function () {
    if (!MonitoringAdapter._instance) {
        if (!config.monitoring || !config.monitoring.adapter) {
            throw new RainError('Monitoring adapter not found in server config!',
                            RainError.ERROR_PRECONDITION_FAILED);
        }

        var module = config.monitoring.adapter.module;

        if (!module) {
            throw new RainError('Please specify a valid monitoring module path!',
                            RainError.ERROR_PRECONDITION_FAILED);
        }

        module = path.join(process.cwd(), module);

        if (!config.monitoring.adapter.options) {
            throw new RainError('Please specify an options key in your monitoring configuration!',
                            RainError.ERROR_PRECONDITION_FAILED);
        }

        if (!config.monitoring.adapter.options.host ||
            !config.monitoring.adapter.options.port) {
            throw new RainError('Please specify a HOST and a port in your monitoring configuration options!',
                            RainError.ERROR_PRECONDITION_FAILED);
        }

        var options = config.monitoring.adapter.options;

        try {
            var Adapter = require(module);
            MonitoringAdapter._instance = new Adapter(options);
        } catch (e){
            logger.error('Failed to load the monitoring adapter!\n\n', e);
            throw new RainError('Failed to load the monitoring adapter');
        }
    }

    return MonitoringAdapter._instance;
};

module.exports = MonitoringAdapter;
