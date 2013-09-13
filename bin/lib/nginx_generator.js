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

var fs = require('fs'),
    path = require('path'),
    util = require('../../lib/util'),
    utils = require('../lib/utils');

/**
 * @name NginxGenerator
 * @param {JSON} configuration the basic configuration located in init/conf/nginx.conf
 * @constructor
 */
function NginxGenerator(configuration) {
    this._baseConfiguration = configuration;
}

/**
 * Generates the configuration file by mapping the regexps of possible request routes with
 * actual correspondance. Generates configuration for javascript routes and resources and stores it in
 * the root of the project.
 */
NginxGenerator.prototype.run = function () {
    var routes = [],
        defaultConfiguration = this._baseConfiguration.nginxConf;

    for(var i = 0, len = this._baseConfiguration.projects.length; i < len; i++) {
        var projectPath = this._baseConfiguration.projects[i];

        util.walkSync(path.join(projectPath, 'components'), ['.json'], function (file, folderPath) {
            if(file.indexOf('..') !== -1) {
                file = path.join(utils.getProjectRoot(process.cwd()), file);
            }
            var configuration = require(file);

            routes.push({
                componentId: configuration.id,
                componentVersion: configuration.version,
                basePath: folderPath + '/client',
                type: 'js',
                regexp: 'location ~* ' + configuration.id + '/' + configuration.version + '/.*(js.*\\.js)$'
            });

            routes.push({
                componentId: configuration.id,
                componentVersion: configuration.version,
                basePath: folderPath,
                type: 'resources',
                regexp: 'location ~* ' + configuration.id + '/' + configuration.version + '/.*(resources.*)$'
            });

        });
    }

    //setUp get latest version case

    var componentLatestVersion = {};

    for(var i = 0, len = routes.length; i < len; i++) {
        var version;
        if(!routes[i].used) {
            version = routes[i].componentVersion;
            componentLatestVersion[routes[i].componentId] = routes[i];
            routes[i].used = true;
        } else {
            continue;
        }
        for(var j = 0, len = routes.length; j < len; j++) {
            if(routes[i].componentId === routes[j].componentId && i !== j) {
                routes[j].used = true;
                if(routes[i].componentVersion < routes[j].componentVersion) {
                    componentLatestVersion[routes[i].componentId] = routes[j];
                }
            }
        }
    }

    for (var componentId in componentLatestVersion) {
        var regexpJS = 'location ~* ' + componentId+ '/.*(js.*\\.js)$',
            regexpRes = 'location ~* ' + componentId + '/.*(resources.*)$';

        var comp = Object.create(componentLatestVersion[componentId]);
        comp.regexp = regexpJS;
        routes.push(comp);
        comp =  Object.create(componentLatestVersion[componentId]);
        comp.regexp = regexpRes;
        comp.basePath = comp.basePath.replace('/client', '');
        routes.push(comp);
    }


    for(var i = 0, len = routes.length; i < len; i++) {
        defaultConfiguration.http.server.locations[routes[i].regexp] = {
            alias: routes[i].basePath + '/$1'
        };
    }

    var fd = fs.openSync('nginx.conf', 'w'),
        stream = fs.createWriteStream('nginx.conf', {
            flags: 'w',
            encoding: 'utf-8',
            mode: '0644',
            fd: fd
        }),
        NEWLINE = ('win32' === process.platform) ? '\r\n' :
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
                    for(var j = 0; j < level; j++) {
                        stream.write('\t');
                    }
                    stream.write('}'+NEWLINE);
                }
            } else {
                stream.write(' ' + object[i] + ';' + NEWLINE);
            }
        }
    };

    walkObjectSync(defaultConfiguration, 0);
};

module.exports = NginxGenerator;
