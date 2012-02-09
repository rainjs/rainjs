/*
Copyright (c) 2011, Claus Augusti <claus@formatvorlage.de>
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

"use strict";

/**
 * Main server.
 * Handles a very simple kind of dependency injection, to be refactored to some service
 * registry thing. 
 */

var mod_connect = require('connect'),
    mod_sys = require('sys'),
    mod_path = require('path'),
    mod_resourceService = null,
    mod_resourceManager = null,
    mod_componentContainer = null,
    componentContainer = null,
    mod_cache = require('./cache.js'),
    mod_socketio = require('./socketio.js'),
    mod_socketMothership = require('./socket_mothership'),
    mod_sessionStore = require('./session_store'),
    socketClient = null,
    mod_frontController = null,
    mod_fs = require('fs'),
    cache = null,
    redisClient = null,
    errorHandler = null,
    sessionParser = null,
    mod_validateConf = require('./validate_conf'),
    logger = require('./logger.js').getLogger(mod_path.basename(module.filename)),
    mod_handlebars = require('./handlebars');

// add the components folder to require.paths
// TODO: move this to NODE_PATH when we switch to node 0.6
require.paths.push(process.cwd() + '/components');


// [TBD] dynamic configServer service (requires dependency management first)

/** TODO: remove if debugging information from --debug fixed with an endOfLine */
console.log('');

var configServer = null,
    configModules = null,
    args = {};

for (var i = 2, l = process.argv.length; i < l; i++) {
    var arg = process.argv[i];
    if (arg.indexOf('=') > 1) {
        arg = arg.split('=');
        args[arg[0]] = arg[1];
    }
}

if (!args['server-conf']) {
    logger.info('set default: server.conf.default');
    args['server-conf'] = mod_path.join(__dirname, '..', 'conf', 'server.conf.default');
}
logger.info('reading server configuration from ' + args['server-conf']);
mod_fs.readFile(args['server-conf'], function (err, data) {
    if (err) {
        logger.error('error reading server configuration');
        process.exit();
    }

    configServer = JSON.parse(data);

    mod_validateConf.validate(configServer);

    configServer.server.serverRoot = mod_path.resolve(configServer.server.serverRoot);
    configServer.server.documentRoot = mod_path.resolve(__dirname, '..');
    configServer.server.componentPath = mod_path.resolve(configServer.server.componentPath);

    // Make server configuration global.
    global.Server = {
        conf : configServer,
        UUID : '',
        root : __dirname + '/..'
    };

    logger.info('server configuration loaded');
    configureServer(configServer);
});

function configureServer(configServer) {
    mod_cache.configure(configServer);
    mod_resourceManager = require('./resourcemanager.js')(configServer, mod_cache);
    mod_componentContainer = require('./componentcontainer.js');
    componentContainer = new mod_componentContainer.ComponentContainer(mod_resourceManager);
    mod_resourceService = require('./resourceservice.js')(configServer, mod_resourceManager, mod_cache, componentContainer);
    mod_frontController = require('./frontcontroller.js')(mod_resourceManager, componentContainer);
    sessionParser = require('./sessionParser');
    errorHandler = require('./errorHandler.js')({
        showStack : true,
        showMessage : true,
        dumpExceptions : false
    });

    if (configServer.remotecontrol) {
        logger.info('setting up remote control');
        redisClient = require('./redisclient.js');
        redisClient.init(mod_tagmanager);
    }
    
    //setup handlebars
    mod_handlebars.setup();

    createServer(configServer);
    logger.info('server started on port ' + configServer.server.port + ', ' + new Date());
}

function createServer(configServer) {

    // Connect to mothership.
    if (Server.conf.mothership && Server.conf.mothership.connect) {
        mod_socketMothership.init({
            components: componentContainer.componentMap
        });
        socketClient = mod_socketMothership.client;
    };
    var sessionStore = new mod_sessionStore(socketClient);

    Server.session = sessionStore;

    var server = mod_connect.createServer(
        mod_connect.logger('dev'),
        mod_connect.favicon(),
        mod_connect.cookieParser(),
        mod_connect.session({key: 'rain.sid', store: sessionStore,
                             secret: 'let it rain baby ;)',
                             cookie: {path: "/", httpOnly: false}}),
        mod_connect.bodyParser(),
        mod_connect.query(),
        mod_connect.router(function (app) {
            app.get(/^\/.+\/([^\/]*)(\/htdocs\/.*\.html)$/, mod_frontController.handleViewRequest);
            app.get(/^\/[^\/]+\/([^\/]*)\/controller\/(.*)$/, mod_frontController.handleControllerRequest);
            app.put(/^\/[^\/]+\/([^\/]*)\/controller\/(.*)$/, mod_frontController.handleControllerRequest);
            app.post(/^\/[^\/]+\/([^\/]*)\/controller\/(.*)$/, mod_frontController.handleControllerRequest);
            app.delete(/^\/[^\/]+\/([^\.]*)\/controller\/(.*)$/, mod_frontController.handleControllerRequest);
            app.get(/^\/resources(.*)$/, mod_resourceService.handleRequest);
        }),
        mod_connect.static(configServer.server.documentRoot),
        sessionParser(),
        mod_frontController.handleResourceNotFound,
        errorHandler
    );

    if (configServer.websockets) {
        logger.info('starting websockets');
        var io = require('socket.io').listen(server);
        mod_socketio.init(io);
    }

    server.listen(configServer.server.port);
}
