var path = require('path');

describe('Logging socket plugin', function() {
    var plugin, Spy = {}, mocks = {}, componentConf = {
        id: 'my-component',
        version: '1.0.0'
    };

    beforeEach(function() {
        Spy.socketRegistry = jasmine.createSpyObj('Spy.socketRegistry', ['register']);
        mocks['../socket_registry'] = Spy.socketRegistry;

        plugin = loadModuleExports(path.join('lib', 'registry', 'logging.js'), mocks);
    });

    it('should correctly register a component', function () {
        plugin.configure(componentConf);

        expect(Spy.socketRegistry.register).toHaveBeenCalledWith('/my-component/1.0.0/logging',
            jasmine.any(Function), {
                id: 'my-component',
                version: '1.0.0'
            });
    });
});
