"use strict";

var path = require('path');
var fs = require('fs');
var util = require('./util');
var config = require('./configuration');
var componentsDirectories = config.server.components;
var compileTemplate = require('./registry/precompile_templates').configure;
var compileLess = require('./registry/precompile_less').configure;
var componentRegistry = require('./component_registry');

//add server lib
watchFiles(path.join(__dirname));

//add all components
for (var i = componentsDirectories.length; i--;){
    watchFiles(path.join(config.serverRoot, componentsDirectories[i]));
}

function watchFiles() {
    for (var i = arguments.length; i--;){
        var folder = arguments[i];
        util.walkSync(folder, function(file) {
            watch(file, folder);
        })
    }
}

//watch(path.join(__dirname, 'watcher.js'));

function watch(file, folder) {
    fs.watchFile(file, function (curr, prev) {
        if (curr.mtime.getTime() != prev.mtime.getTime()) {
            switch (path.extname(file)) {
                case '.css':
                    recompileCSS(file, folder);
                    break;
                case '.html':
                    recompileTemplate(file, folder);
                    break;
            } 
        }
    });
}


function recompileCSS(file, folder) {
    console.info('CSS %s changed', file.replace(folder, ''));
    var componentFolder = file.replace(folder, '').split('/')[1];
    var metaFile = fs.readFile(path.join(folder, componentFolder, 'meta.json'), function(err, filecontent) {
        var meta = JSON.parse(filecontent);
        var config = componentRegistry.getConfig(meta.id, meta.version);
        compileLess(config);
        console.info('CSS %s new precompiled');
    })
}

function recompileTemplate(file, folder) {
    console.info('Template %s changed', file.replace(folder, ''));
    var componentFolder = file.replace(folder, '').split('/')[1];
    var metaFile = fs.readFile(path.join(folder, componentFolder, 'meta.json'), function(err, filecontent) {
        var meta = JSON.parse(filecontent);
        var config = componentRegistry.getConfig(meta.id, meta.version);
        compileTemplate(config);
        console.info('Template %s new precompiled');
    });
}
