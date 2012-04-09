"use strict";

var cwd = process.cwd();
var path = require('path');
var globals = require(cwd + '/lib/globals');
var loadFile = require(cwd + '/tests/server/rain_mocker');

var configurationsFolder = cwd + '/tests/server/fixtures/';

describe('Server configuration and validation', function () {

    /**
     * Use a specific configuration file for the server.
     *
     * @param {String} configPath the configuration file path
     */
    function loadConfiguration(configPath) {
        var mockConfiguration = loadFile(cwd + '/lib/configuration.js', {
            'commander': {
                'conf': configPath
            }
        }, true);
        return new mockConfiguration.Configuration();
    }

    it('must set the language to the default one', function () {
        var configuration = loadConfiguration(configurationsFolder + 'server_two.conf');
        expect(configuration.language).toBe('en_US');
    });

    it('must set the language to the one specified in the configuration', function () {
        var configuration = loadConfiguration();
        expect(configuration.language).toBe('ro_RO');
    });

    it('must throw an error when language is missing', function () {
        expect(function () {
            loadConfiguration(configurationsFolder + 'server_three.conf');
        }).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
    });

});
