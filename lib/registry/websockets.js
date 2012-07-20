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

var path = require('path'),
    Translation = require('../translation'),
    util = require('../util'),
    socketRegistry = require('../socket_registry'),
    logger = require('../logging').get();

/**
 * Configure the Websocket plugin.
 *
 * @param {Object} componentConf the component configuration
 */
function configure(componentConf) {
    var socketsPath = path.join(componentConf.folder,
                                'server', 'websockets');

    util.walkSync(socketsPath, function (path) {
        var handler = requireWithContext(path, Translation.get().generateContext(componentConf)),
            channel = '/' + componentConf.id + '/'
                          + componentConf.version
                          + ((handler.channel.charAt(0) !== '/') ? '/' : '') + handler.channel;

        socketRegistry.register(channel, handler.handle);
        logger.info('Added channel for: ' + channel);
    });
}

module.exports = {
    name: 'Websockets Plugin',
    configure: configure
};
