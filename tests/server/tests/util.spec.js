"use strict";

var cwd = process.cwd();
var path = require('path');
var globals = require(cwd + '/lib/globals.js');
var logger = require(cwd + '/lib/logger.js');
var configuration = require(cwd + '/lib/configuration.js');

var util = require(cwd + '/lib/util.js');

describe('Util module', function () {

    var mockComponentRegistry, componentRegistry;
    mockComponentRegistry = loadModuleContext('/lib/component_registry.js');
    mockComponentRegistry.scanComponentFolder();
    componentRegistry = new mockComponentRegistry.ComponentRegistry();

    var config = componentRegistry.getConfig('button', '1.0');
    var folder = config.folder;

    it('must call the callback for all files', function () {
        var files = [];
        util.walkSync(folder, [], function (file) {
            files.push(file);
        });
        expect(files.length).toBe(9);
    });

    it('must call the callback only for a set of files', function () {
        var files = [];
        util.walkSync(folder, ['.css'], function (file) {
            files.push(file);
        });
        expect(files.length).toBe(1);
        expect(files[0]).toBe(path.join(config.paths('css', true), 'index.css'));

        files = [];
        util.walkSync(folder, ['.css', '.json', '.html'], function (file) {
            files.push(file);
        });
        expect(files.length).toBe(4);
    });
});
