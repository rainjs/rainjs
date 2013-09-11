"use strict";

var fs = require('fs'),
    path = require('path'),
    util = require('../../lib/util'),
    utils = require('../lib/utils');

function NginxGenerator(configuration) {
    this._baseConfiguration = configuration;
};

NginxGenerator.prototype.run = function () {


    var routes = [],
        defaultConfiguration = this._baseConfiguration.nginxConf;

    for(var i = 0, len = this._baseConfiguration.projects.length; i < len; i++) {
        var projectPath = this._baseConfiguration.projects[i];

        util.walkSync(path.join(projectPath, 'components'), ['.json'], function(file, folderPath) {
            if(file.indexOf('..') !== -1) {
                file = path.join(utils.getProjectRoot(process.cwd()), file);
            }
            var configuration = require(file);
            /*folderPath = folderPath.split('/');
             folderPath.pop();
             folderPath = folderPath.join('/');*/
            //folderPath = folderPath.join('/');

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

        componentLatestVersion[componentId].regexp = regexpJS;
        routes.push(componentLatestVersion[componentId]);
        componentLatestVersion[componentId].regexp = regexpRes;
        routes.push(componentLatestVersion[componentId]);
    }


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

module.exports = NginxGenerator;
