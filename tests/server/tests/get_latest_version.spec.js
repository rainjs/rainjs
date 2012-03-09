var globals = require(process.cwd() + '/lib/globals.js');
var config = require(process.cwd() + '/lib/configuration.js');
var componentRegistry = require(process.cwd() + '/lib/component_registry.js').initialize();

describe('get latest version', function() {

    it('must get the correct version', function() {
        expect(componentRegistry.getLatestVersion('example', '1')).toEqual('1.3.0');
        expect(componentRegistry.getLatestVersion('example', '0.0.1')).toEqual('0.0.1');
        expect(componentRegistry.getLatestVersion('example')).toEqual('4.5.2');
        expect(componentRegistry.getLatestVersion('example', '1.3')).toEqual('1.3.5');
        expect(componentRegistry.getLatestVersion('example', '1')).toEqual('1.3.5');
        expect(componentRegistry.getLatestVersion('example', '2')).toEqual('2.0.1');
    });

    it('must be undefined version', function() {
        expect(componentRegistry.getLatestVersion('example', '6')).toBeUndefined();
        expect(componentRegistry.getLatestVersion('example_dosnt_exist')).toBeUndefined();
        expect(componentRegistry.getLatestVersion('example', '3')).toBeUndefined();
    });
});
