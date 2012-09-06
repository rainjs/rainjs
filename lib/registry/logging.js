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

var socketRegistry = require('../socket_registry'),
    logging = require('../logging'),
    logger = logging.get();

/**
 * Configure the logging plugin.
 *
 * @param {Object} componentConf the component configuration
 */
function configure(componentConf) {
    if (componentConf.id === 'core') {
        return; // no need to register a socket for the core component
    }

    var channel = '/' + componentConf.id + '/' +
                    componentConf.version + '/logging';

    socketRegistry.register(channel, function (socket) {
        var componentLogger = logging.get(componentConf);
        socket.on('log', log.bind(this, componentLogger));
    }, componentConf);

    logger.info('Added logging channel: ' + channel);
}


/**
 * Logs an event received from the client
 *
 * @param {Logger} componentLogger the logger instance for the component
 * @param {Object} event the event to be logged
 * @param {String} event.level the log level of the event
 * @param {String} event.message the log message
 *
 * @returns {[type]} [description]
 */
function log(componentLogger, event) {
    if (Object.keys(logging.LEVELS).indexOf(event.level) === -1) {
        logger.warn('Could not log client message: ' + event.message +
                    ' level: ' + event.level + ' doesn\'t exist');
        return;
    }

    componentLogger[event.level](event.message);
}

module.exports = {
    name: 'Logging Plugin',
    configure: configure,
    _log: log
};
