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
    fs = require('fs'),
    color = require('colors'),
    util = require('../../lib/util'),
    utils = require('../lib/utils');

/**
 * Register the create component command.
 *
 * @param {Program} program
 */
function register(program) {
    program
        .command('generate-nginx-conf')
        .description('Generate the nginix configuration file')
        .action(generateNginxConfiguration);
}

function generateNginxConfiguration () {

    try {
        var defaultConfiguration = fs.readFileSync(path.join(utils.getProjectRoot(), '/bin/init/conf/nginx.conf'));

        defaultConfiguration = JSON.parse(defaultConfiguration);
    } catch (e) {
        console.log(e.message.red);
        process.exit(1);
    }

    var routes = [];
    util.walkSync(path.join(utils.getProjectRoot(), 'components'), ['.json'], function(file, folderPath) {
        var configuration = require(file);
        /*folderPath = folderPath.split('/');
        folderPath.pop();
        folderPath = folderPath.join('/');*/
        //folderPath = folderPath.join('/');

        routes.push({
            componentId: configuration.id,
            componentVersion: configuration.version,
            basePath: folderPath + '/client',
            regexp: 'location ~* ' + configuration.id + '/.*(js.*\\.js)$'
        });

        routes.push({
            componentId: configuration.id,
            componentVersion: configuration.version,
            basePath: folderPath,
            regexp: 'location ~* ' + configuration.id + '/.*(resources.*)$'
        })
    });

    for(var i = 0, len = routes.length; i < len; i++) {
        defaultConfiguration.http.server.locations[routes[i].regexp] = {
            alias: routes[i].basePath + '/$1'
         };
    }

    var fd = fs.openSync('nginx.conf', 'w');
    var stream = fs.createWriteStream('nginx.conf', {
        flags: 'w',
        encoding: 'utf-8',
        mode: '0644',
        fd: fd
    });

    var NEWLINE = ('win32' === process.platform) ? '\r\n' :
        ('darwin' === process.platform) ? '\r' : '\n';

    var walkObjectSync = function (object, level) {
        for(var i in object) {
            for(var j = 0; j < level; j++) {
                stream.write('\t');
            }
            if(i !== 'locations') {
                stream.write(i);
            }

            if(typeof object[i] === 'object') {
                if(i !== 'locations' ) {
                    stream.write(' {'+NEWLINE);
                }
                walkObjectSync(object[i], level+1);
                if(i !== 'locations') {
                    console.log(i);
                    for(var j = 0; j < level; j++) {
                        stream.write('\t');
                    }
                    stream.write('}'+NEWLINE);
                }
            } else {
                stream.write(' ' + object[i] + ';' + NEWLINE);
            }
        }
    }

    console.log(util.inspect(defaultConfiguration, true, null, true));
    walkObjectSync(defaultConfiguration, 0);

}


module.exports = register;
